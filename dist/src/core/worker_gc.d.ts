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
interface HeapStats {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
}
export declare class WorkerGC {
    private largeArrays;
    private idleCallbackId;
    /**
     * 강제 GC 트리거
     */
    triggerGC(): void;
    /**
     * 대형 배열 등록 (GC 우선순위)
     */
    markLargeArray<T>(array: T[]): void;
    /**
     * 내부 캐시 정리
     */
    clearCache(): void;
    /**
     * 힙 메모리 통계
     */
    getHeapStats(): HeapStats | null;
    /**
     * 메모리 압력 감지
     */
    isMemoryPressure(): boolean;
    /**
     * 유휴 시간 정리 스케줄링
     */
    requestIdleCleanup(): void;
    /**
     * 정리
     */
    dispose(): void;
}
/**
 * WorkerGC 인스턴스 생성
 */
export declare function createWorkerGC(): WorkerGC;
export {};
//# sourceMappingURL=worker_gc.d.ts.map