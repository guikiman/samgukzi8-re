/**
 * [Task 82] 워커 타임아웃 + 행 감지 + 강제 재시작 — WorkerTimeoutWatchdog
 *
 * Web Worker의 응답 시간을 모니터링하고 제한 시간 초과 시 강제 재시작.
 */

export interface WatchdogConfig {
  readonly timeoutMs: number;
  readonly maxRetries: number;
  readonly heartbeatIntervalMs: number;
}

const DEFAULT_CONFIG: WatchdogConfig = {
  timeoutMs: 30000,
  maxRetries: 3,
  heartbeatIntervalMs: 5000,
};

export type WorkerStatus = "HEALTHY" | "STALLED" | "TIMEOUT" | "TERMINATED" | "RESTARTING";

export class WorkerTimeoutWatchdog {
  private config: WatchdogConfig;
  private worker: Worker | null = null;
  private status: WorkerStatus = "TERMINATED";
  private lastHeartbeat = Date.now();
  private retryCount = 0;
  private timeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config?: Partial<WatchdogConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  attach(worker: Worker): void {
    this.worker = worker;
    this.status = "HEALTHY";
    this.lastHeartbeat = Date.now();
    this.retryCount = 0;
    this.startMonitoring();
  }

  detach(): void {
    this.stopMonitoring();
    this.worker = null;
    this.status = "TERMINATED";
  }

  private startMonitoring(): void {
    this.stopMonitoring();
    this.heartbeatTimer = setInterval(() => {
      if (this.status === "HEALTHY" && Date.now() - this.lastHeartbeat > this.config.timeoutMs) {
        this.status = "STALLED";
        this.handleTimeout();
      }
    }, this.config.heartbeatIntervalMs);
  }

  private stopMonitoring(): void {
    if (this.timeoutTimer) { clearTimeout(this.timeoutTimer); this.timeoutTimer = null; }
    if (this.heartbeatTimer) { clearInterval(this.heartbeatTimer); this.heartbeatTimer = null; }
  }

  private handleTimeout(): void {
    this.status = "TIMEOUT";
    if (this.retryCount >= this.config.maxRetries) {
      this.status = "TERMINATED";
      this.terminateWorker();
      return;
    }

    this.retryCount++;
    this.status = "RESTARTING";
    this.restartWorker();
  }

  private terminateWorker(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }

  private restartWorker(): void {
    this.terminateWorker();
    this.status = "HEALTHY";
    this.lastHeartbeat = Date.now();
  }

  recordHeartbeat(): void {
    this.lastHeartbeat = Date.now();
    if (this.status === "STALLED" || this.status === "TIMEOUT") {
      this.status = "HEALTHY";
    }
  }

  getStatus(): WorkerStatus { return this.status; }
  getRetryCount(): number { return this.retryCount; }
  getMaxRetries(): number { return this.config.maxRetries; }
  hasExceededMaxRetries(): boolean { return this.retryCount >= this.config.maxRetries; }

  setTimeoutMs(ms: number): void {
    this.config = { ...this.config, timeoutMs: ms };
  }

  resetRetries(): void {
    this.retryCount = 0;
  }
}
