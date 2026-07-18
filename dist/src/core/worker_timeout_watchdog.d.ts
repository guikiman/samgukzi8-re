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
export type WorkerStatus = "HEALTHY" | "STALLED" | "TIMEOUT" | "TERMINATED" | "RESTARTING";
export declare class WorkerTimeoutWatchdog {
    private config;
    private worker;
    private status;
    private lastHeartbeat;
    private retryCount;
    private timeoutTimer;
    private heartbeatTimer;
    constructor(config?: Partial<WatchdogConfig>);
    attach(worker: Worker): void;
    detach(): void;
    private startMonitoring;
    private stopMonitoring;
    private handleTimeout;
    private terminateWorker;
    private restartWorker;
    recordHeartbeat(): void;
    getStatus(): WorkerStatus;
    getRetryCount(): number;
    getMaxRetries(): number;
    hasExceededMaxRetries(): boolean;
    setTimeoutMs(ms: number): void;
    resetRetries(): void;
}
//# sourceMappingURL=worker_timeout_watchdog.d.ts.map