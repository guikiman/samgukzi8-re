/**
 * [Task 51 / E57] OffscreenCanvas 렌더러 — OffscreenCanvasRenderer
 *
 * 목적: Web Worker에서 Canvas 렌더링을 수행하여
 *       메인 스레드 부하를 0으로 만듦.
 *
 * 핵심 로직:
 *   1. OffscreenCanvas를 Worker로 전송
 *   2. Worker 내부에서 렌더링 루프 실행
 *   3. Worker 에러 핸들링 및 자동 재시작
 *   4. 프레임 통계 추적
 */

export interface FrameData {
  readonly command: "render" | "resize" | "clear";
  readonly data?: unknown;
  readonly timestamp: number;
}

export class OffscreenCanvasRenderer {
  private worker: Worker | null = null;
  private canvas: OffscreenCanvas | null = null;
  private renderedFrames = 0;
  private droppedFrames = 0;
  private lastFrameTime = 0;
  private frameCount = 0;
  private retryCount = 0;
  private readonly maxRetries = 3;
  private workerUrl = "";
  private frameTimes: number[] = [];

  /**
   * OffscreenCanvas API 지원 여부 확인
   */
  static isSupported(): boolean {
    return typeof OffscreenCanvas !== "undefined" && typeof Worker !== "undefined";
  }

  /** OffscreenCanvas 초기화 */
  async init(canvas: HTMLCanvasElement, workerUrl: string): Promise<void> {
    this.workerUrl = workerUrl;
    try {
      this.canvas = canvas.transferControlToOffscreen();
      this.spawnWorker();
    } catch (e) {
      console.error("[OffscreenCanvasRenderer] Init failed:", e);
      throw e;
    }
  }

  /** Worker 생성 */
  private spawnWorker(): void {
    this.worker = new Worker(this.workerUrl);

    this.worker.onerror = (e) => {
      console.error("[OffscreenCanvasRenderer] Worker error:", e);
      this.handleWorkerCrash();
    };

    this.worker.onmessageerror = () => {
      console.error("[OffscreenCanvasRenderer] Worker message error");
      this.handleWorkerCrash();
    };

    // 초기 메시지 전송
    this.worker.postMessage(
      { type: "init", canvas: this.canvas },
      [this.canvas!],
    );
  }

  /** Worker 충돌 처리 */
  private handleWorkerCrash(): void {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      console.log(`[OffscreenCanvasRenderer] Restarting worker (attempt ${this.retryCount}/${this.maxRetries})`);
      this.spawnWorker();
    } else {
      console.error("[OffscreenCanvasRenderer] Max retries reached");
    }
  }

  /** 렌더링 명령 전송 */
  render(data: unknown): void {
    this.lastFrameTime = performance.now();
    try {
      const frame: FrameData = { command: "render", data, timestamp: this.lastFrameTime };
      this.worker?.postMessage(frame);
      this.renderedFrames++;
    } catch {
      this.droppedFrames++;
    }
  }

  /** Worker 메시지 수신 */
  onMessage(callback: (data: unknown) => void): void {
    this.worker?.addEventListener("message", (e) => {
      callback(e.data);
    });
  }

  /** 리사이즈 */
  resize(width: number, height: number): void {
    this.worker?.postMessage({ type: "resize", width, height });
  }

  /** 품질 설정 전송 */
  setQuality(level: "low" | "medium" | "high"): void {
    this.worker?.postMessage({ type: "setQuality", level });
  }

  /** 렌더링 통계 */
  getStats(): { renderedFrames: number; droppedFrames: number; averageFPS: number } {
    return {
      renderedFrames: this.renderedFrames,
      droppedFrames: this.droppedFrames,
      averageFPS: this.calculateFPS(),
    };
  }

  private calculateFPS(): number {
    if (this.frameTimes.length < 2) return 0;
    const now = performance.now();
    this.frameTimes.push(now);
    if (this.frameTimes.length > 60) this.frameTimes.shift();

    const elapsed = now - this.frameTimes[0];
    return elapsed > 0 ? Math.round((this.frameTimes.length / elapsed) * 1000) : 0;
  }

  /** 정리 */
  destroy(): void {
    this.worker?.terminate();
    this.worker = null;
    this.canvas = null;
    this.retryCount = 0;
  }
}
