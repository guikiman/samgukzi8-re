/**
 * [Task 65] Worker GC — WorkerGC
 *
 * 목적: Web Worker 내 메모리 정리 및 가비지 컬렉션 트리거.
 *
 * 핵심 로직:
 *   1. 전역 gc() 호출 (Node.js --expose-gc)
 *   2. 메모리 압력 감지 (performance.memory)
 *   3. requestIdleCallback 기반 유휴 정리
 */
export class WorkerGC {
    constructor() {
        this.largeArrays = [];
        this.idleCallbackId = null;
    }
    /**
     * 강제 GC 트리거
     */
    triggerGC() {
        const gc = globalThis.gc;
        if (typeof gc === "function") {
            gc();
        }
        // Soft cleanup: clear large arrays
        this.largeArrays = [];
    }
    /**
     * 대형 배열 등록 (GC 우선순위)
     */
    markLargeArray(array) {
        if (array.length > 10000) {
            this.largeArrays.push(new ArrayBuffer(0));
        }
    }
    /**
     * 내부 캐시 정리
     */
    clearCache() {
        this.largeArrays = [];
    }
    /**
     * 힙 메모리 통계
     */
    getHeapStats() {
        const mem = performance.memory;
        if (!mem)
            return null;
        return {
            usedJSHeapSize: mem.usedJSHeapSize,
            totalJSHeapSize: mem.totalJSHeapSize,
            jsHeapSizeLimit: mem.jsHeapSizeLimit,
        };
    }
    /**
     * 메모리 압력 감지
     */
    isMemoryPressure() {
        const stats = this.getHeapStats();
        if (!stats)
            return false;
        return stats.usedJSHeapSize / stats.jsHeapSizeLimit > 0.8;
    }
    /**
     * 유휴 시간 정리 스케줄링
     */
    requestIdleCleanup() {
        if (typeof requestIdleCallback === "undefined") {
            setTimeout(() => this.triggerGC(), 1000);
            return;
        }
        if (this.idleCallbackId !== null)
            return;
        this.idleCallbackId = requestIdleCallback(() => {
            this.idleCallbackId = null;
            if (this.isMemoryPressure()) {
                this.triggerGC();
            }
        }, { timeout: 2000 });
    }
    /**
     * 정리
     */
    dispose() {
        if (this.idleCallbackId !== null && typeof cancelIdleCallback !== "undefined") {
            cancelIdleCallback(this.idleCallbackId);
        }
        this.idleCallbackId = null;
        this.largeArrays = [];
    }
}
/**
 * WorkerGC 인스턴스 생성
 */
export function createWorkerGC() {
    return new WorkerGC();
}
//# sourceMappingURL=worker_gc.js.map