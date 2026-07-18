/**
 * [Task 89] 워커 메모리 누수 자가 진단 — WorkerMemoryDiagnostics
 *
 * Web Worker 내 메모리 사용량을 추적하고 누수를 탐지.
 */
export interface MemorySample {
    readonly timestamp: number;
    readonly heapSize: number;
    readonly objectCount: number;
    readonly transferableCount: number;
}
export interface MemoryReport {
    readonly samples: MemorySample[];
    readonly growthRate: number;
    readonly isLeaking: boolean;
    readonly peakMemory: number;
    readonly averageMemory: number;
}
export declare class WorkerMemoryDiagnostics {
    private samples;
    private readonly maxSamples;
    private leakThreshold;
    constructor(maxSamples?: number, leakThreshold?: number);
    takeSample(): void;
    private countActiveObjects;
    getReport(): MemoryReport;
    clear(): void;
    getSampleCount(): number;
    setLeakThreshold(threshold: number): void;
}
//# sourceMappingURL=worker_memory_diagnostics.d.ts.map