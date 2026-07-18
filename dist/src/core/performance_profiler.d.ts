/**
 * [E48] 성능 프로파일링 모듈 — Performance Profiling
 *
 * Records and monitors key performance metrics:
 * 1. Frame rate
 * 2. Memory usage
 * 3. Web Worker pool utilization
 * 4. API/IO latency
 * 5. Three.js WebGL statistics
 */
export interface PerfSnapshot {
    readonly timestamp: number;
    readonly fps: number;
    readonly jsHeapUsed: number;
    readonly jsHeapTotal: number;
    readonly numDocuments: number;
}
export interface PerfReport {
    readonly snapshots: PerfSnapshot[];
    readonly fspAvg: number;
    readonly fspMin: number;
    readonly fspMax: number;
    readonly memoryPeak: number;
    readonly duration: number;
}
export declare class PerformanceProfiler {
    private snapshots;
    private intervalId;
    start(): void;
    stop(): PerfReport;
    private captureSnapshot;
    private measureFps;
    private generateReport;
    getSnapshotCount(): number;
}
//# sourceMappingURL=performance_profiler.d.ts.map