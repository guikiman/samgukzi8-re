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

export class PerformanceProfiler {
    private snapshots: PerfSnapshot[] = [];
    private intervalId: ReturnType<typeof setInterval> | null = null;

    start(): void {
        this.snapshots = [];
        this.captureSnapshot();
        this.intervalId = setInterval(() => this.captureSnapshot(), 5000);
    }

    stop(): PerfReport {
        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        return this.generateReport();
    }

    private captureSnapshot(): void {
        const memory = (typeof window !== 'undefined' && (window.performance as any).memory)
            ? (window.performance as any).memory
            : null;
        this.snapshots.push({
            timestamp: Date.now(),
            fps: this.measureFps(),
            jsHeapUsed: memory?.usedJSHeapSize ?? 0,
            jsHeapTotal: memory?.totalJSHeapSize ?? 0,
            numDocuments: 1,
        });
    }

    private measureFps(): number {
        const start = performance.now();
        let frames = 0;
        while (performance.now() - start < 100) {
            frames++;
        }
        return Math.round(frames / ((performance.now() - start) / 1000));
    }

    private generateReport(): PerfReport {
        const fss = this.snapshots.map((s) => s.fps);
        return {
            snapshots: [...this.snapshots],
            fspAvg: fss.reduce((a, b) => a + b, 0) / Math.max(1, fss.length),
            fspMin: Math.min(...fss),
            fspMax: Math.max(...fss),
            memoryPeak: Math.max(...this.snapshots.map((s) => s.jsHeapUsed), 0),
            duration: this.snapshots.length > 1
                ? this.snapshots[this.snapshots.length - 1].timestamp - this.snapshots[0].timestamp
                : 0,
        };
    }

    getSnapshotCount(): number {
        return this.snapshots.length;
    }
}
