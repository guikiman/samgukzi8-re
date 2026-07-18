/**
 * [Task 82] 워커 타임아웃 + 행 감지 + 강제 재시작 — WorkerTimeoutWatchdog
 *
 * Web Worker의 응답 시간을 모니터링하고 제한 시간 초과 시 강제 재시작.
 */
const DEFAULT_CONFIG = {
    timeoutMs: 30000,
    maxRetries: 3,
    heartbeatIntervalMs: 5000,
};
export class WorkerTimeoutWatchdog {
    constructor(config) {
        this.worker = null;
        this.status = "TERMINATED";
        this.lastHeartbeat = Date.now();
        this.retryCount = 0;
        this.timeoutTimer = null;
        this.heartbeatTimer = null;
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    attach(worker) {
        this.worker = worker;
        this.status = "HEALTHY";
        this.lastHeartbeat = Date.now();
        this.retryCount = 0;
        this.startMonitoring();
    }
    detach() {
        this.stopMonitoring();
        this.worker = null;
        this.status = "TERMINATED";
    }
    startMonitoring() {
        this.stopMonitoring();
        this.heartbeatTimer = setInterval(() => {
            if (this.status === "HEALTHY" && Date.now() - this.lastHeartbeat > this.config.timeoutMs) {
                this.status = "STALLED";
                this.handleTimeout();
            }
        }, this.config.heartbeatIntervalMs);
    }
    stopMonitoring() {
        if (this.timeoutTimer) {
            clearTimeout(this.timeoutTimer);
            this.timeoutTimer = null;
        }
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }
    handleTimeout() {
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
    terminateWorker() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
    }
    restartWorker() {
        this.terminateWorker();
        this.status = "HEALTHY";
        this.lastHeartbeat = Date.now();
    }
    recordHeartbeat() {
        this.lastHeartbeat = Date.now();
        if (this.status === "STALLED" || this.status === "TIMEOUT") {
            this.status = "HEALTHY";
        }
    }
    getStatus() { return this.status; }
    getRetryCount() { return this.retryCount; }
    getMaxRetries() { return this.config.maxRetries; }
    hasExceededMaxRetries() { return this.retryCount >= this.config.maxRetries; }
    setTimeoutMs(ms) {
        this.config = { ...this.config, timeoutMs: ms };
    }
    resetRetries() {
        this.retryCount = 0;
    }
}
//# sourceMappingURL=worker_timeout_watchdog.js.map