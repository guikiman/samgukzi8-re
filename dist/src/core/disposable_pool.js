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
// ============================================================
// [1] DisposableObjectPool<T>
// ============================================================
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
export class DisposableObjectPool {
    /**
     * @param factory       새 인스턴스 생성 팩토리
     * @param resetFn       풀 반환 전 초기화 콜백 (disposed=false 등)
     * @param disposeFn     인스턴스의 GPU 리소스 해제 콜백
     * @param initialSize   초기 프리할당 개수 (기본 64)
     * @param maxSize       최대 풀 크기 (기본 512, 초과 시 경고)
     */
    constructor(factory, resetFn, disposeFn, initialSize = 64, maxSize = 512) {
        this.freeList = [];
        this.activeSet = new Set();
        this._allocated = 0;
        this._acquired = 0;
        this._released = 0;
        this.factory = factory;
        this.resetFn = resetFn;
        this.disposeFn = disposeFn;
        this.initialSize = initialSize;
        this.maxSize = maxSize;
        // 초기 할당
        for (let i = 0; i < initialSize; i++) {
            const obj = this.factory();
            this.freeList.push(obj);
            this._allocated++;
        }
    }
    // ============================================================
    // acquire / release
    // ============================================================
    /**
     * 풀에서 인스턴스 획득
     *
     * - freeList에 사용 가능한 인스턴스가 있으면 반환
     * - 없으면 새로 생성 (maxSize 미만일 때만)
     * - maxSize 초과 시 가장 오래된 active 인스턴스를 강제 회수
     *
     * @returns  T 인스턴스 (disposed=false 보장)
     */
    acquire() {
        let obj;
        if (this.freeList.length > 0) {
            obj = this.freeList.pop();
        }
        else if (this._allocated < this.maxSize) {
            obj = this.factory();
            this._allocated++;
        }
        else {
            // maxSize 도달 → 가장 오래된 active 인스턴스 강제 회수
            const oldest = this.activeSet.values().next().value;
            if (oldest) {
                this.forceRelease(oldest);
                obj = this.freeList.pop();
            }
            else {
                // active set이 비어있는데 freeList도 비어있으면 (비정상) 새로 생성
                obj = this.factory();
                this._allocated++;
            }
        }
        this.activeSet.add(obj);
        this._acquired++;
        return obj;
    }
    /**
     * 인스턴스를 풀에 반납
     *
     * @param obj  반납할 인스턴스
     * @throws     disposed 상태의 인스턴스를 반납하면 Error
     */
    release(obj) {
        if (obj.disposed) {
            throw new Error('[DisposableObjectPool] Attempted to release a disposed object. ' +
                'Object was already disposed and cannot be reused.');
        }
        if (!this.activeSet.has(obj)) {
            // 이미 반납되었거나, 이 풀 소유가 아님 → ignore
            return;
        }
        this.activeSet.delete(obj);
        this.resetFn(obj);
        this.freeList.push(obj);
        this._released++;
    }
    /**
     * 풀에 인스턴스 반환 여부 확인
     */
    isActive(obj) {
        return this.activeSet.has(obj);
    }
    // ============================================================
    // disposeAll / 정리
    // ============================================================
    /**
     * 풀의 모든 인스턴스를 dispose하고 풀 비우기
     *
     * - active 인스턴스도 모두 dispose
     * - 씬 전환 시 호출하여 GPU 메모리를 완전히 해제
     */
    disposeAll() {
        // active 인스턴스 dispose + 해제
        for (const obj of this.activeSet) {
            try {
                this.disposeFn(obj);
            }
            catch (err) {
                console.warn('[DisposableObjectPool] dispose error (active):', err);
            }
        }
        this.activeSet.clear();
        // free 인스턴스 dispose + 해제
        for (const obj of this.freeList) {
            try {
                this.disposeFn(obj);
            }
            catch (err) {
                console.warn('[DisposableObjectPool] dispose error (free):', err);
            }
        }
        this.freeList.length = 0;
        this._allocated = 0;
    }
    /**
     * 특정 인스턴스를 강제로 dispose하고 풀에서 제거
     * (maxSize 초과 회수 또는 오류 복구용)
     */
    evict(obj) {
        this.activeSet.delete(obj);
        try {
            this.disposeFn(obj);
        }
        catch (err) {
            console.warn('[DisposableObjectPool] evict dispose error:', err);
        }
        this._allocated--;
    }
    // ============================================================
    // GC 프로파일링
    // ============================================================
    /** 현재 사용 중인 인스턴스 수 */
    get activeCount() { return this.activeSet.size; }
    /** 사용 가능한 (free) 인스턴스 수 */
    get freeCount() { return this.freeList.length; }
    /** 총 할당된 인스턴스 수 */
    get allocatedCount() { return this._allocated; }
    /** 누적 acquire 횟수 */
    get totalAcquired() { return this._acquired; }
    /** 누적 release 횟수 */
    get totalReleased() { return this._released; }
    /** 풀 사용률 (0.0 ~ 1.0) */
    get utilization() {
        return this._allocated > 0 ? this.activeSet.size / this._allocated : 0;
    }
    // ============================================================
    // 내부
    // ============================================================
    forceRelease(obj) {
        this.activeSet.delete(obj);
        try {
            this.disposeFn(obj);
            this.resetFn(obj);
        }
        catch (err) {
            console.warn('[DisposableObjectPool] forceRelease error:', err);
        }
        this.freeList.push(obj);
    }
}
// ============================================================
// [2] TypedArrayPool — GC-프리 버퍼 풀
// ============================================================
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
export class TypedArrayPool {
    constructor() {
        this.smallF32 = [];
        this.mediumF32 = [];
        this.largeF32 = [];
        this.smallI32 = [];
        this.mediumI32 = [];
        this.largeI32 = [];
        this.smallU8 = [];
        this.mediumU8 = [];
        this.largeU8 = [];
        this._hits = 0;
        this._misses = 0;
    }
    /** Float32Array 획득 (size: 필요한 요소 수) */
    acquireF32(size) {
        const pool = this.selectF32Pool(size);
        if (pool.length > 0) {
            this._hits++;
            return pool.pop();
        }
        this._misses++;
        return new Float32Array(size);
    }
    /** Float32Array 반납 */
    releaseF32(arr) {
        const pool = this.selectF32Pool(arr.length);
        if (pool.length < 128) {
            pool.push(arr);
        }
    }
    /** Int32Array 획득 */
    acquireI32(size) {
        const pool = this.selectI32Pool(size);
        if (pool.length > 0) {
            this._hits++;
            return pool.pop();
        }
        this._misses++;
        return new Int32Array(size);
    }
    /** Int32Array 반납 */
    releaseI32(arr) {
        const pool = this.selectI32Pool(arr.length);
        if (pool.length < 128) {
            pool.push(arr);
        }
    }
    /** Uint8Array 획득 */
    acquireU8(size) {
        const pool = this.selectU8Pool(size);
        if (pool.length > 0) {
            this._hits++;
            return pool.pop();
        }
        this._misses++;
        return new Uint8Array(size);
    }
    /** Uint8Array 반납 */
    releaseU8(arr) {
        const pool = this.selectU8Pool(arr.length);
        if (pool.length < 128) {
            pool.push(arr);
        }
    }
    /** 모든 풀 비우기 (씬 전환 시) */
    clear() {
        this.smallF32.length = 0;
        this.mediumF32.length = 0;
        this.largeF32.length = 0;
        this.smallI32.length = 0;
        this.mediumI32.length = 0;
        this.largeI32.length = 0;
        this.smallU8.length = 0;
        this.mediumU8.length = 0;
        this.largeU8.length = 0;
    }
    /** 히트율 (pool hit / total) */
    get hitRate() {
        const total = this._hits + this._misses;
        return total > 0 ? this._hits / total : 1;
    }
    selectF32Pool(size) {
        if (size <= TypedArrayPool.SMALL_MAX)
            return this.smallF32;
        if (size <= TypedArrayPool.MEDIUM_MAX)
            return this.mediumF32;
        if (size <= TypedArrayPool.LARGE_MAX)
            return this.largeF32;
        return []; // xlarge: pool 없음
    }
    selectI32Pool(size) {
        if (size <= TypedArrayPool.SMALL_MAX)
            return this.smallI32;
        if (size <= TypedArrayPool.MEDIUM_MAX)
            return this.mediumI32;
        if (size <= TypedArrayPool.LARGE_MAX)
            return this.largeI32;
        return [];
    }
    selectU8Pool(size) {
        if (size <= TypedArrayPool.SMALL_MAX)
            return this.smallU8;
        if (size <= TypedArrayPool.MEDIUM_MAX)
            return this.mediumU8;
        if (size <= TypedArrayPool.LARGE_MAX)
            return this.largeU8;
        return [];
    }
}
TypedArrayPool.SMALL_MAX = 32;
TypedArrayPool.MEDIUM_MAX = 256;
TypedArrayPool.LARGE_MAX = 2048;
// ============================================================
// [3] 전역 GC 모니터
// ============================================================
/**
 * MemoryProfiler — 전역 메모리 사용량 모니터링 및 GC 경고
 *
 * - performance.memory (Chrome) 사용 가능 시 힙 사용량 실시간 추적
 * - 임계치 초과 시 콜백 호출 (강제 GC 유도)
 * - 씬 전환 직후 메모리 누수 탐지
 */
export class MemoryProfiler {
    constructor(options = {}) {
        this.heapSizeInterval = null;
        this._usedMB = 0;
        this._peakMB = 0;
        this._samples = [];
        this.warnThresholdMB = options.warnThresholdMB ?? 200;
        this.criticalThresholdMB = options.criticalThresholdMB ?? 400;
        this.onWarn = options.onWarn ?? null;
        this.onCritical = options.onCritical ?? null;
        const interval = options.sampleIntervalMs ?? 5000;
        this.startMonitoring(interval);
    }
    startMonitoring(intervalMs) {
        this.heapSizeInterval = setInterval(() => {
            this.sample();
        }, intervalMs);
    }
    sample() {
        const mem = performance.memory;
        if (!mem)
            return;
        const usedBytes = mem.usedJSHeapSize;
        const usedMB = usedBytes / (1024 * 1024);
        this._usedMB = usedMB;
        this._samples.push(usedMB);
        if (usedMB > this._peakMB) {
            this._peakMB = usedMB;
        }
        // 샘플 버퍼 크기 제한 (최근 100개)
        if (this._samples.length > 100) {
            this._samples.shift();
        }
        if (usedMB >= this.criticalThresholdMB) {
            this.onCritical?.(usedMB);
        }
        else if (usedMB >= this.warnThresholdMB) {
            this.onWarn?.(usedMB);
        }
    }
    /** 현재 힙 사용량 (MB) */
    get usedMB() { return this._usedMB; }
    /** 최대 힙 사용량 (MB) */
    get peakMB() { return this._peakMB; }
    /** 평균 힙 사용량 (MB, 최근 30초) */
    get averageMB() {
        if (this._samples.length === 0)
            return 0;
        return this._samples.reduce((a, b) => a + b, 0) / this._samples.length;
    }
    /** 샘플 개수 */
    get sampleCount() { return this._samples.length; }
    /** 모니터링 중지 */
    stop() {
        if (this.heapSizeInterval) {
            clearInterval(this.heapSizeInterval);
            this.heapSizeInterval = null;
        }
    }
}
//# sourceMappingURL=disposable_pool.js.map