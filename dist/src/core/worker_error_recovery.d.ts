/**
 * [Task 87] 워커 오류 복구 전략 — WorkerErrorRecovery
 *
 * Web Worker 내 오류 발생 시 자동 복구 로직.
 * Retry, Fallback, Graceful Degradation 전략 제공.
 */
export type ErrorSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type RecoveryStrategy = "RETRY" | "FALLBACK" | "DEGRADE" | "RESTART" | "ABORT";
export interface WorkerError {
    readonly id: string;
    readonly message: string;
    readonly stack?: string;
    readonly severity: ErrorSeverity;
    readonly timestamp: number;
    readonly turn: number;
    readonly context: string;
}
export interface RecoveryAction {
    readonly strategy: RecoveryStrategy;
    readonly description: string;
    readonly retryCount: number;
    readonly maxRetries: number;
    readonly fallbackHandler?: string;
}
export interface RecoveryResult {
    readonly success: boolean;
    readonly action: RecoveryAction;
    readonly recoveryTimeMs: number;
    readonly error: WorkerError;
}
export declare class WorkerErrorRecovery {
    private errors;
    private recoveryHistory;
    private retryCounts;
    private readonly maxRetries;
    private idCounter;
    /**
     * 오류 등록 및 복구 실행
     */
    handleError(message: string, severity: ErrorSeverity, turn: number, context: string, stack?: string): RecoveryResult;
    /**
     * 오류 심각도에 따른 복구 전략 결정
     */
    private determineStrategy;
    /**
     * 복구 전략 실행
     */
    private executeRecovery;
    /**
     * 재시도 횟수 초기화
     */
    resetRetryCount(context: string): void;
    resetAllRetryCounts(): void;
    /**
     * 오류 통계
     */
    getErrorStats(): {
        totalErrors: number;
        recovered: number;
        failed: number;
        criticalCount: number;
    };
    getRecentErrors(count?: number): WorkerError[];
    getRecoveryHistory(): RecoveryResult[];
    clear(): void;
}
//# sourceMappingURL=worker_error_recovery.d.ts.map