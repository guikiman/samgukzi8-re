/**
 * [E51] 가비지 컬렉션 플러시 임계값 — GarbageCollectionFlushThreshold
 *
 * 목적: 일정 메모리 임계값 초과 시 강제 GC 유도로
 *       장시간 플레이 메모리 누수 방지.
 *
 * 핵심 로직:
 *   1. 주기적 메모리 사용량 체크
 *   2. 임계값 초과 시 캐시 플러시 + GC 유도
 */
export interface MemoryStats {
    readonly usedJSHeapMB: number;
    readonly totalJSHeapMB: number;
    readonly thresholdMB: number;
    readonly isOverThreshold: boolean;
}
export declare class GarbageCollectionFlushThreshold {
    private thresholdMB;
    private checkIntervalMs;
    private intervalId;
    private onFlushCallbacks;
    constructor(thresholdMB?: number, checkIntervalMs?: number);
    /** 주기적 메모리 체크 시작 */
    start(): void;
    /** 주기적 체크 중지 */
    stop(): void;
    /** 메모리 통계 */
    getMemoryStats(): {
        usedJSHeapMB: number;
        totalJSHeapMB: number;
    };
    /** 플러시 콜백 등록 */
    onFlush(callback: () => void): void;
    private flushCallbacks;
    /** 강제 플러시 */
    triggerFlush(): void;
}
//# sourceMappingURL=gc_flush_threshold.d.ts.map