/**
 * 삼국지 8 리메이크 — WebGL 컨텍스트 복구 + 전역 리소스 추적기
 * 파일: src/core/webgl_recovery.ts
 *
 * [493] WebGL 컨텍스트 분실/복구 + 씬 전환 GC 자동 청소
 *
 * ── 복구 파이프라인 ──
 *
 *   Context Lost 발생
 *     ↓
 *   1. RenderSnapshot 직렬화 (카메라 행렬, 유닛 위치, 이펙트 상태)
 *   2. 모든 WebGL 리소스 강제 dispose (GLProtector가 기존 리소스 정리)
 *   3. 게임 루프 일시 중지
 *     ↓
 *   Context Restored 발생
 *     ↓
 *   4. GLProtector.shaders/textures/buffers 전부 재생성
 *   5. RenderSnapshot 역직렬화 → 원래 상태로 복원
 *   6. 게임 루프 재개
 *
 * ── ResourceTracker ──
 *   - 모든 IDisposable 리소스의 활성 목록 유지
 *   - disposeScope()로 씬 단위 일괄 해제
 *   - disposeAll()으로 전역 정리
 */
import { IDisposable } from './disposable_pool.js';
/** 카메라 행렬 스냅샷 */
export interface CameraSnapshot {
    readonly projectionMatrix: Float64Array;
    readonly viewMatrix: Float64Array;
    readonly position: {
        readonly x: number;
        readonly y: number;
        readonly z: number;
    };
    readonly target: {
        readonly x: number;
        readonly y: number;
        readonly z: number;
    };
    readonly zoom: number;
}
/** 유닛 렌더 스냅샷 */
export interface UnitRenderSnapshot {
    readonly unitId: number;
    readonly hexX: number;
    readonly hexY: number;
    readonly hexZ: number;
    readonly hpPercent: number;
    readonly moralePercent: number;
    readonly isSelected: boolean;
    readonly animationState: string;
}
/** 전법 이펙트 스냅샷 */
export interface EffectSnapshot {
    readonly effectId: string;
    readonly position: {
        readonly x: number;
        readonly y: number;
        readonly z: number;
    };
    readonly duration: number;
    readonly elapsed: number;
    readonly intensity: number;
}
/** 전체 렌더 스냅샷 (컨텍스트 분실 시 저장) */
export interface RenderSnapshot {
    readonly camera: CameraSnapshot;
    readonly units: readonly UnitRenderSnapshot[];
    readonly effects: readonly EffectSnapshot[];
    readonly hexGrid: {
        readonly width: number;
        readonly height: number;
        readonly visibleRegion: {
            readonly minX: number;
            readonly minY: number;
            readonly maxX: number;
            readonly maxY: number;
        };
    };
    readonly timestamp: number;
    readonly weatherState: string;
    readonly ambientLight: {
        readonly intensity: number;
        readonly color: readonly [number, number, number];
    };
}
/** 복구 상태 열거 */
export type RecoveryState = 'NORMAL' | 'LOST' | 'SNAPSHOT_SAVED' | 'RESTORING' | 'RESTORED' | 'FATAL';
/** WebGL 리소스 재생성 콜백 */
export interface GLResourceFactory {
    createShaders(): Promise<IDisposable[]> | IDisposable[];
    createTextures(): Promise<IDisposable[]> | IDisposable[];
    createBuffers(): Promise<IDisposable[]> | IDisposable[];
    createFramebuffers(): Promise<IDisposable[]> | IDisposable[];
}
/** 복구 진행률 */
export interface RecoveryProgress {
    readonly state: RecoveryState;
    readonly phase: string;
    readonly progress: number;
    readonly shadersDone: number;
    readonly texturesDone: number;
    readonly buffersDone: number;
    readonly totalShaders: number;
    readonly totalTextures: number;
    readonly totalBuffers: number;
}
/**
 * GLProtector — WebGL GPU 리소스(shader/texture/buffer)의
 *              생명주기(생성/추적/해제/재생성)를 전담 관리
 *
 * 이 클래스가 하는 일:
 *   - 등록된 모든 GPU 리소스 추적
 *   - 일괄 dispose() (컨텍스트 분실 시)
 *   - 일괄 recreate() (컨텍스트 복구 시)
 *   - 리소스 누수 방지 (추적되지 않은 리소스가 남지 않도록)
 */
export declare class GLProtector {
    private readonly shaders;
    private readonly textures;
    private readonly buffers;
    private readonly framebuffers;
    private readonly factory;
    private _disposed;
    constructor(factory: GLResourceFactory);
    registerShader(shader: IDisposable): void;
    registerTexture(texture: IDisposable): void;
    registerBuffer(buffer: IDisposable): void;
    registerFramebuffer(fb: IDisposable): void;
    /**
     * 모든 등록된 GPU 리소스 일괄 해제
     * Context Lost 발생 시 호출
     */
    disposeAllGPUResources(): void;
    /**
     * 모든 GPU 리소스 재생성 (Context Restored 시)
     *
     * @param onProgress  복구 진행률 콜백
     * @returns           재생성 완료 시 resolve
     */
    recreateAllGPUResources(onProgress?: (progress: RecoveryProgress) => void): Promise<void>;
    get disposed(): boolean;
    get shaderCount(): number;
    get textureCount(): number;
    get bufferCount(): number;
}
/**
 * WebGLRecoveryManager — WebGL 컨텍스트 분실/복구 전체 파이프라인
 *
 * ── 생애주기 ──
 *
 * 1. init(canvas, factory) 호출로 바인딩
 *    - webglcontextlost / webglcontextrestored 이벤트 등록
 *    - GLProtector 생성
 *
 * 2. 컨텍스트 분실 (Context Lost):
 *    a. preventDefault로 기본 복구 차단 (수동 복구)
 *    b. snapshot() → 모든 렌더링 상태 직렬화
 *    c. GLProtector.disposeAllGPUResources() → 기존 GPU 리소스 해제
 *    d. 게임 루프 일시 중지
 *    e. state = LOST
 *
 * 3. 컨텍스트 복구 (Context Restored):
 *    a. state = RESTORING
 *    b. GLProtector.recreateAllGPUResources() → 모든 리소스 재생성
 *    c. restore(snapshot) → 카메라/유닛/이펙트 상태 복원
 *    d. 게임 루프 재개
 *    e. state = RESTORED → NORMAL
 *
 * 4. 복구 실패 시:
 *    a. 최대 재시도 횟수 초과 → FATAL 상태
 *    b. onFatal 콜백 호출
 */
export declare class WebGLRecoveryManager {
    private canvas;
    private gl;
    private _protector;
    private _state;
    private snapshot;
    private readonly onLost;
    private readonly onRestored;
    private readonly onFatal;
    private readonly onProgress;
    private retryCount;
    private readonly maxRetries;
    private lostHandler;
    private restoredHandler;
    private _lastSnapshotTime;
    constructor(options?: {
        onLost?: (snapshot: RenderSnapshot) => void;
        onRestored?: () => void;
        onFatal?: (error: Error) => void;
        onProgress?: (progress: RecoveryProgress) => void;
    });
    /**
     * WebGL 컨텍스트에 바인딩
     *
     * @param canvas   대상 Canvas 요소
     * @param gl       WebGL 컨텍스트 (WebGL1 또는 WebGL2)
     * @param factory  GPU 리소스 재생성 팩토리
     */
    init(canvas: HTMLCanvasElement, gl: WebGLRenderingContext | WebGL2RenderingContext, factory: GLResourceFactory): void;
    private bindEvents;
    /**
     * 현재 렌더링 상태의 스냅샷 생성
     *
     * @param camera     카메라 상태
     * @param units      유닛 렌더 상태 배열
     * @param effects    활성 전법 이펙트 배열
     * @param weather    기상 상태
     * @param hexGrid    헥사 그리드 정보
     * @param ambient    앰비언트 라이트
     * @returns          직렬화된 RenderSnapshot
     */
    createSnapshot(camera: CameraSnapshot, units: readonly UnitRenderSnapshot[], effects: readonly EffectSnapshot[], weather: string, hexGrid: {
        width: number;
        height: number;
        visibleRegion: {
            minX: number;
            minY: number;
            maxX: number;
            maxY: number;
        };
    }, ambient: {
        intensity: number;
        color: readonly [number, number, number];
    }): RenderSnapshot;
    private handleContextLost;
    private handleContextRestored;
    /**
     * 저장된 스냅샷에서 렌더링 상태 복원
     *
     * @param snapshot  createSnapshot()으로 저장한 스냅샷
     */
    restoreFromSnapshot(snapshot: RenderSnapshot): void;
    private applyCamera;
    private applyAmbientLight;
    private createEmptySnapshot;
    /** 현재 복구 상태 */
    get state(): RecoveryState;
    /** GLProtector 참조 */
    getProtector(): GLProtector | null;
    /** @deprecated Use getProtector() */
    get protector(): GLProtector | null;
    /** 마지막 스냅샷 */
    get lastSnapshot(): RenderSnapshot | null;
    /** 현재 스냅샷 시간 (성능 측정용) */
    get lastSnapshotTime(): number;
    /**
     * 수동 스냅샷 설정 (외부에서 생성한 스냅샷 주입)
     */
    setSnapshot(snapshot: RenderSnapshot): void;
    /** 이벤트 리스너 해제 */
    dispose(): void;
}
/**
 * ResourceTracker — 모든 IDisposable 리소스의 생명주기를 추적하고
 *                   씬 전환 시 일괄 해제하는 전역 청소기
 *
 * ── 사용 예 ──
 * ```typescript
 * const tracker = ResourceTracker.getInstance();
 *
 * // 리소스 등록
 * tracker.track(texture, 'texture');
 * tracker.track(geometry, 'geometry');
 * tracker.track(eventListener, 'listener');
 *
 * // 씬 전환 시:
 * tracker.disposeScope('battle');
 * tracker.disposeScope('council');
 *
 * // 전체 정리:
 * tracker.disposeAll();
 * ```
 */
export declare class ResourceTracker {
    private static instance;
    private readonly resources;
    private readonly scopes;
    private _totalTracked;
    private _totalDisposed;
    private readonly leakWarnThreshold;
    private constructor();
    static getInstance(): ResourceTracker;
    /**
     * 리소스를 추적에 등록
     *
     * @param resource  IDisposable 리소스
     * @param type      리소스 종류 ('texture', 'geometry', 'material', 'shader', 'listener', 'animation', 'generic')
     * @param scope     소속 scope ('battle', 'council', 'worldmap', 'ui', 'global')
     */
    track(resource: IDisposable, type?: string, scope?: string): void;
    /**
     * 특정 타입의 모든 리소스 해제
     */
    disposeType(type: string): number;
    /**
     * 특정 scope의 모든 리소스 일괄 해제
     * 씬 전환 시 호출 (예: disposeScope('battle') → 전투 씬 리소스 전부 정리)
     */
    disposeScope(scope: string): number;
    /**
     * 모든 리소스 해제 (게임 종료 시)
     */
    disposeAll(): number;
    /**
     * Window/DOM 이벤트 리스너를 IDisposable로 래핑하여 추적
     *
     * 사용 예:
     * ```typescript
     * const listener = tracker.trackListener(window, 'resize', onResize);
     * // 씬 전환 시 자동으로 removeEventListener 호출
     * ```
     */
    trackListener(target: EventTarget, type: string, handler: EventListenerOrEventListenerObject, options?: AddEventListenerOptions, scope?: string): IDisposable;
    /**
     * requestAnimationFrame ID를 래핑하여 추적
     */
    trackAnimationFrame(id: number, scope?: string): IDisposable;
    /**
     * setInterval ID를 래핑하여 추적
     */
    trackInterval(id: ReturnType<typeof setInterval>, scope?: string): IDisposable;
    /** 현재 추적 중인 총 리소스 수 */
    get totalTracked(): number;
    get totalDisposed(): number;
    /** 등록된 모든 scope 이름 */
    get scopeNames(): string[];
    /** 특정 scope의 리소스 수 */
    countByScope(scope: string): number;
    /** 타입별 리소스 수 */
    countByType(type: string): number;
    /**
     * 보고서 생성
     */
    generateReport(): string;
}
/**
 * 웹 페이지에 WebGL 복구 시스템을 자동으로 바인딩
 *
 * @param canvas   Canvas 요소
 * @param gl       WebGL 컨텍스트
 * @param factory  GPU 리소스 재생성 팩토리
 * @returns        WebGLRecoveryManager 인스턴스
 */
export declare function initWebGLRecovery(canvas: HTMLCanvasElement, gl: WebGLRenderingContext | WebGL2RenderingContext, factory: GLResourceFactory): WebGLRecoveryManager;
//# sourceMappingURL=webgl_recovery.d.ts.map