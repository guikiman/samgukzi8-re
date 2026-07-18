/**
 * [Task 89] 워커 메모리 누수 자가 진단 — WorkerMemoryDiagnostics
 *
 * Web Worker 내 메모리 사용량을 추적하고 누수를 탐지.
 */
export class WorkerMemoryDiagnostics {
    constructor(maxSamples = 100, leakThreshold = 0.1) {
        this.samples = [];
        this.maxSamples = maxSamples;
        this.leakThreshold = leakThreshold;
    }
    takeSample() {
        const sample = {
            timestamp: Date.now(),
            heapSize: performance.memory
                ? performance.memory.usedJSHeapSize ?? 0
                : 0,
            objectCount: this.countActiveObjects(),
            transferableCount: 0,
        };
        this.samples.push(sample);
        if (this.samples.length > this.maxSamples) {
            this.samples.shift();
        }
    }
    countActiveObjects() {
        return this.samples.length;
    }
    getReport() {
        if (this.samples.length < 2) {
            return {
                samples: [...this.samples],
                growthRate: 0,
                isLeaking: false,
                peakMemory: this.samples.length > 0 ? this.samples[this.samples.length - 1].heapSize : 0,
                averageMemory: this.samples.length > 0
                    ? this.samples.reduce((s, m) => s + m.heapSize, 0) / this.samples.length
                    : 0,
            };
        }
        const first = this.samples[0];
        const last = this.samples[this.samples.length - 1];
        const duration = last.timestamp - first.timestamp;
        const growthRate = duration > 0 ? (last.heapSize - first.heapSize) / duration : 0;
        const isLeaking = growthRate > this.leakThreshold;
        const peakMemory = Math.max(...this.samples.map((s) => s.heapSize));
        const averageMemory = this.samples.reduce((s, m) => s + m.heapSize, 0) / this.samples.length;
        return {
            samples: [...this.samples],
            growthRate: Math.round(growthRate * 1000) / 1000,
            isLeaking,
            peakMemory,
            averageMemory: Math.round(averageMemory),
        };
    }
    clear() {
        this.samples = [];
    }
    getSampleCount() {
        return this.samples.length;
    }
    setLeakThreshold(threshold) {
        this.leakThreshold = threshold;
    }
}
//# sourceMappingURL=worker_memory_diagnostics.js.map