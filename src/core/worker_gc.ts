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

export class WorkerGC {
  private largeArrays: ArrayBuffer[] = [];
  private idleCallbackId: number | null = null;

  /**
   * 강제 GC 트리거
   */
  triggerGC(): void {
    const gc = (globalThis as unknown as { gc?: () => void }).gc;
    if (typeof gc === "function") {
      gc();
    }
    // Soft cleanup: clear large arrays
    this.largeArrays = [];
  }

  /**
   * 대형 배열 등록 (GC 우선순위)
   */
  markLargeArray<T>(array: T[]): void {
    if (array.length > 10000) {
      this.largeArrays.push(new ArrayBuffer(0));
    }
  }

  /**
   * 내부 캐시 정리
   */
  clearCache(): void {
    this.largeArrays = [];
  }

  /**
   * 힙 메모리 통계
   */
  getHeapStats(): HeapStats | null {
    const mem = (performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
    if (!mem) return null;
    return {
      usedJSHeapSize: mem.usedJSHeapSize,
      totalJSHeapSize: mem.totalJSHeapSize,
      jsHeapSizeLimit: mem.jsHeapSizeLimit,
    };
  }

  /**
   * 메모리 압력 감지
   */
  isMemoryPressure(): boolean {
    const stats = this.getHeapStats();
    if (!stats) return false;
    return stats.usedJSHeapSize / stats.jsHeapSizeLimit > 0.8;
  }

  /**
   * 유휴 시간 정리 스케줄링
   */
  requestIdleCleanup(): void {
    if (typeof requestIdleCallback === "undefined") {
      setTimeout(() => this.triggerGC(), 1000);
      return;
    }

    if (this.idleCallbackId !== null) return;

    this.idleCallbackId = requestIdleCallback(
      () => {
        this.idleCallbackId = null;
        if (this.isMemoryPressure()) {
          this.triggerGC();
        }
      },
      { timeout: 2000 },
    );
  }

  /**
   * 정리
   */
  dispose(): void {
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
export function createWorkerGC(): WorkerGC {
  return new WorkerGC();
}
