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

export class WorkerMemoryDiagnostics {
  private samples: MemorySample[] = [];
  private readonly maxSamples: number;
  private leakThreshold: number;

  constructor(maxSamples = 100, leakThreshold = 0.1) {
    this.maxSamples = maxSamples;
    this.leakThreshold = leakThreshold;
  }

  takeSample(): void {
    const sample: MemorySample = {
      timestamp: Date.now(),
      heapSize: (performance as unknown as Record<string, unknown>).memory
        ? ((performance as unknown as Record<string, unknown>).memory as Record<string, number>).usedJSHeapSize ?? 0
        : 0,
      objectCount: this.countActiveObjects(),
      transferableCount: 0,
    };

    this.samples.push(sample);
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }
  }

  private countActiveObjects(): number {
    return this.samples.length;
  }

  getReport(): MemoryReport {
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

  clear(): void {
    this.samples = [];
  }

  getSampleCount(): number {
    return this.samples.length;
  }

  setLeakThreshold(threshold: number): void {
    this.leakThreshold = threshold;
  }
}
