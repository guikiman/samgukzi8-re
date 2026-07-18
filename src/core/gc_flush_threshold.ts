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

export class GarbageCollectionFlushThreshold {
    private thresholdMB: number;
    private checkIntervalMs: number;
    private intervalId: number | null = null;
    private onFlushCallbacks: Array<() => void> = [];

    constructor(thresholdMB = 200, checkIntervalMs = 10000) {
        this.thresholdMB = thresholdMB;
        this.checkIntervalMs = checkIntervalMs;
    }

    /** 주기적 메모리 체크 시작 */
    start(): void {
        if (this.intervalId !== null) return;
        this.intervalId = window.setInterval(() => {
            const stats = this.getMemoryStats();
            if (stats.usedJSHeapMB > this.thresholdMB) {
                this.triggerFlush();
            }
        }, this.checkIntervalMs);
    }

    /** 주기적 체크 중지 */
    stop(): void {
        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    /** 메모리 통계 */
    getMemoryStats(): { usedJSHeapMB: number; totalJSHeapMB: number } {
        if (typeof performance !== 'undefined' && (performance as any).memory) {
            const mem = (performance as any).memory;
            return {
                usedJSHeapMB: Math.round(mem.usedJSHeapSize / (1024 * 1024)),
                totalJSHeapMB: Math.round(mem.totalJSHeapSize / (1024 * 1024)),
            };
        }
        return { usedJSHeapMB: 0, totalJSHeapMB: 0 };
    }

    /** 플러시 콜백 등록 */
    onFlush(callback: () => void): void {
        this.flushCallbacks.push(callback);
    }

    private flushCallbacks: Array<() => void> = [];

    /** 강제 플러시 */
    triggerFlush(): void {
        for (const cb of this.flushCallbacks) {
            try { cb(); } catch { /* ignore */ }
        }
    }
}
