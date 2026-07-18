/**
 * [Task 85] 워커 메모리 절약 팁 — WorkerMemoryOptimizer
 *
 * Web Worker 내 메모리 사용량을 최적화하는 전략 제공.
 * 객체 풀링, SharedArrayBuffer, 구조적 공유 등을 활용.
 */
export interface MemoryAdvice {
    readonly category: string;
    readonly advice: string;
    readonly estimatedSaving: string;
    readonly priority: "HIGH" | "MEDIUM" | "LOW";
}
export interface OptimizationReport {
    readonly totalAdviceCount: number;
    readonly highPriorityCount: number;
    readonly appliedStrategies: string[];
    readonly estimatedTotalSaving: string;
}
export declare class WorkerMemoryOptimizer {
    private objectPoolSize;
    private transferableCount;
    private sharedBufferCount;
    /**
     * 객체 풀링 권장 사항 반환
     */
    getPoolingAdvice(currentPoolSize: number): MemoryAdvice;
    /**
     * Transferable 객체 사용 권장
     */
    getTransferableAdvice(useTransferables: boolean): MemoryAdvice;
    /**
     * SharedArrayBuffer 사용 권장
     */
    getSharedBufferAdvice(useSharedBuffer: boolean): MemoryAdvice;
    /**
     * 중간 데이터 정리 권장
     */
    getCleanupAdvice(lastCleanupTurn: number, currentTurn: number): MemoryAdvice;
    /**
     * 종합 최적화 보고서
     */
    getFullReport(): OptimizationReport;
    recordPoolSize(size: number): void;
    recordTransferable(): void;
    recordSharedBuffer(): void;
    reset(): void;
}
//# sourceMappingURL=worker_memory_optimizer.d.ts.map