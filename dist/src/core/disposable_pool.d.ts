/**
 * 삼국지 8 리메이크 — GC-프리 오브젝트 풀링 시스템
 * 파일: src/core/disposable_pool.ts
 *
 * [494] 가비지 컬렉터 프리 메모리 매니저
 *
 * ── 철학 ──
 *   게임의 매 프레임마다 수천 개의 임시 벡터/행렬/지오메트리가 생성/폐기되면
 *   GC가 주기적으로 작동하여 16ms 프레임 예산을 초과하는 Jank가 발생한다.
 *
 *   해결책: 모든 소모성 오브젝트를 Pool에서 재사용한다.
 *   - allocate(): 풀에서 기존 인스턴스 반환 (새 오브젝트 생성 ❌)
 *   - release(): 인스턴스를 풀에 반납 (GC 폐기 ❌)
 *   - disposeAll(): 풀 전체 해제 시 GPU 메모리도 확실히 정리
 *
 * ── 메모리 레이아웃 ──
 *   Pool<T> = T[] (사용 가능한)
 *   active  = Set<T> (현재 사용 중인)
 *   각 T는 IDisposable 인터페이스를 구현하여 dispose() 시 GPU 리소스 해제
 */
/**
 * IDisposable — GPU/네이티브 리소스를 보유한 모든 오브젝트의 기본 인터페이스
 *
 * Three.js의 BufferGeometry, Material, Texture 등은 dispose()를 제공하지만
 * 이 인터페이스가 없어 제네릭 풀에서 일관되게 처리할 수 없다.
 * DisposableObjectPool은 이 인터페이스를 통해 균일한 수명 주기 관리.
 */
export interface IDisposable {
    /** GPU/네이티브 리소스 해제. 호출 후 오브젝트는 사용 불가. */
    dispose(): void;
    /** dispose() 호출 여부 (재사용 전 확인) */
    disposed: boolean;
}
/**
 * DisposableObjectPool<T> — GC-프리 제네릭 오브젝트 풀
 *
 * @template T  생성/폐기할 오브젝트 타입
 *
 * 사용 예:
 * ```typescript
 * class MeshWrapper implements IDisposable {
 *     disposed = false;
 *     geometry?: BufferGeometry;
 *     material?: Material;
 *
 *     dispose(): void {
 *         this.geometry?.dispose();
 *         this.material?.dispose();
 *         this.disposed = true;
 *     }
 *
 *     reset(): void {
 *         // 풀 반환 전 초기화
 *         this.disposed = false;
 *     }
 * }
 *
 * const pool = new DisposableObjectPool(
 *     () => new MeshWrapper(),
 *     (m) => m.reset(),
 *     (m) => m.dispose(),
 *     128,   // initialSize
 *     256,   // maxSize
 * );
 *
 * const mesh = pool.acquire();
 * // ... 사용 ...
 * pool.release(mesh);
 * ```
 *
 * ── 성능 특성 ──
 *   - acquire(): O(1) 평균 (freeList pop)
 *   - release(): O(1) (freeList push)
 *   - disposeAll(): O(N) (모든 active + free 인스턴스 dispose)
 *   - GC allocations: 0 (풀이 모든 인스턴스 소유)
 */
export declare class DisposableObjectPool<T extends IDisposable> {
    private readonly factory;
    private readonly resetFn;
    private readonly disposeFn;
    private readonly freeList;
    private readonly activeSet;
    private readonly initialSize;
    private readonly maxSize;
    private _allocated;
    private _acquired;
    private _released;
    /**
     * @param factory       새 인스턴스 생성 팩토리
     * @param resetFn       풀 반환 전 초기화 콜백 (disposed=false 등)
     * @param disposeFn     인스턴스의 GPU 리소스 해제 콜백
     * @param initialSize   초기 프리할당 개수 (기본 64)
     * @param maxSize       최대 풀 크기 (기본 512, 초과 시 경고)
     */
    constructor(factory: () => T, resetFn: (obj: T) => void, disposeFn: (obj: T) => void, initialSize?: number, maxSize?: number);
    /**
     * 풀에서 인스턴스 획득
     *
     * - freeList에 사용 가능한 인스턴스가 있으면 반환
     * - 없으면 새로 생성 (maxSize 미만일 때만)
     * - maxSize 초과 시 가장 오래된 active 인스턴스를 강제 회수
     *
     * @returns  T 인스턴스 (disposed=false 보장)
     */
    acquire(): T;
    /**
     * 인스턴스를 풀에 반납
     *
     * @param obj  반납할 인스턴스
     * @throws     disposed 상태의 인스턴스를 반납하면 Error
     */
    release(obj: T): void;
    /**
     * 풀에 인스턴스 반환 여부 확인
     */
    isActive(obj: T): boolean;
    /**
     * 풀의 모든 인스턴스를 dispose하고 풀 비우기
     *
     * - active 인스턴스도 모두 dispose
     * - 씬 전환 시 호출하여 GPU 메모리를 완전히 해제
     */
    disposeAll(): void;
    /**
     * 특정 인스턴스를 강제로 dispose하고 풀에서 제거
     * (maxSize 초과 회수 또는 오류 복구용)
     */
    evict(obj: T): void;
    /** 현재 사용 중인 인스턴스 수 */
    get activeCount(): number;
    /** 사용 가능한 (free) 인스턴스 수 */
    get freeCount(): number;
    /** 총 할당된 인스턴스 수 */
    get allocatedCount(): number;
    /** 누적 acquire 횟수 */
    get totalAcquired(): number;
    /** 누적 release 횟수 */
    get totalReleased(): number;
    /** 풀 사용률 (0.0 ~ 1.0) */
    get utilization(): number;
    private forceRelease;
}
/**
 * TypedArrayPool — Float32Array/Int32Array 등의 GC-프리 재사용 풀
 *
 * WebGL 버퍼 업로드, 벡터 연산 등에서 임시 TypedArray 생성으로 인한
 * GC 부하를 제거하기 위한 전용 풀.
 *
 * 크기별로 세그먼트를 나누어 단편화 방지:
 *   - small:     ≤ 32 elements
 *   - medium:    ≤ 256 elements
 *   - large:     ≤ 2048 elements
 *   - xlarge:    > 2048 elements (별도 관리)
 */
export declare class TypedArrayPool {
    private readonly smallF32;
    private readonly mediumF32;
    private readonly largeF32;
    private readonly smallI32;
    private readonly mediumI32;
    private readonly largeI32;
    private readonly smallU8;
    private readonly mediumU8;
    private readonly largeU8;
    private _hits;
    private _misses;
    private static readonly SMALL_MAX;
    private static readonly MEDIUM_MAX;
    private static readonly LARGE_MAX;
    /** Float32Array 획득 (size: 필요한 요소 수) */
    acquireF32(size: number): Float32Array;
    /** Float32Array 반납 */
    releaseF32(arr: Float32Array): void;
    /** Int32Array 획득 */
    acquireI32(size: number): Int32Array;
    /** Int32Array 반납 */
    releaseI32(arr: Int32Array): void;
    /** Uint8Array 획득 */
    acquireU8(size: number): Uint8Array;
    /** Uint8Array 반납 */
    releaseU8(arr: Uint8Array): void;
    /** 모든 풀 비우기 (씬 전환 시) */
    clear(): void;
    /** 히트율 (pool hit / total) */
    get hitRate(): number;
    private selectF32Pool;
    private selectI32Pool;
    private selectU8Pool;
}
/**
 * MemoryProfiler — 전역 메모리 사용량 모니터링 및 GC 경고
 *
 * - performance.memory (Chrome) 사용 가능 시 힙 사용량 실시간 추적
 * - 임계치 초과 시 콜백 호출 (강제 GC 유도)
 * - 씬 전환 직후 메모리 누수 탐지
 */
export declare class MemoryProfiler {
    private heapSizeInterval;
    private readonly warnThresholdMB;
    private readonly criticalThresholdMB;
    private readonly onWarn;
    private readonly onCritical;
    private _usedMB;
    private _peakMB;
    private _samples;
    constructor(options?: {
        warnThresholdMB?: number;
        criticalThresholdMB?: number;
        onWarn?: (usedMB: number) => void;
        onCritical?: (usedMB: number) => void;
        sampleIntervalMs?: number;
    });
    private startMonitoring;
    private sample;
    /** 현재 힙 사용량 (MB) */
    get usedMB(): number;
    /** 최대 힙 사용량 (MB) */
    get peakMB(): number;
    /** 평균 힙 사용량 (MB, 최근 30초) */
    get averageMB(): number;
    /** 샘플 개수 */
    get sampleCount(): number;
    /** 모니터링 중지 */
    stop(): void;
}
//# sourceMappingURL=disposable_pool.d.ts.map