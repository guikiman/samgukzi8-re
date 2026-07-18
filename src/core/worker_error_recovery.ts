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

export class WorkerErrorRecovery {
  private errors: WorkerError[] = [];
  private recoveryHistory: RecoveryResult[] = [];
  private retryCounts = new Map<string, number>();
  private readonly maxRetries = 3;
  private idCounter = 0;

  /**
   * 오류 등록 및 복구 실행
   */
  handleError(
    message: string,
    severity: ErrorSeverity,
    turn: number,
    context: string,
    stack?: string,
  ): RecoveryResult {
    const error: WorkerError = {
      id: `werr_${this.idCounter++}`,
      message, stack, severity, timestamp: Date.now(), turn, context,
    };
    this.errors.push(error);

    const action = this.determineStrategy(error);
    const recoveryResult = this.executeRecovery(error, action);
    this.recoveryHistory.push(recoveryResult);
    return recoveryResult;
  }

  /**
   * 오류 심각도에 따른 복구 전략 결정
   */
  private determineStrategy(error: WorkerError): RecoveryAction {
    const key = error.context;
    const currentRetries = this.retryCounts.get(key) ?? 0;

    switch (error.severity) {
      case "LOW":
        return {
          strategy: "RETRY",
          description: "저중요도 오류 — 단순 재시도",
          retryCount: currentRetries,
          maxRetries: this.maxRetries,
        };

      case "MEDIUM":
        if (currentRetries < 2) {
          return {
            strategy: "RETRY",
            description: "중간 중요도 — 재시도 후 폴백",
            retryCount: currentRetries,
            maxRetries: 2,
            fallbackHandler: "fallback_compute",
          };
        }
        return {
          strategy: "FALLBACK",
          description: "폴백 모드로 전환",
          retryCount: currentRetries,
          maxRetries: 2,
          fallbackHandler: "fallback_compute",
        };

      case "HIGH":
        if (currentRetries < 1) {
          return {
            strategy: "RETRY",
            description: "고중요도 — 1회 재시도 후 기능 축소",
            retryCount: currentRetries,
            maxRetries: 1,
          };
        }
        return {
          strategy: "DEGRADE",
          description: "기능 축소 모드로 전환",
          retryCount: currentRetries,
          maxRetries: 1,
        };

      case "CRITICAL":
        return {
          strategy: "RESTART",
          description: "치명적 오류 — 워커 재시작",
          retryCount: currentRetries,
          maxRetries: this.maxRetries,
        };
    }
  }

  /**
   * 복구 전략 실행
   */
  private executeRecovery(error: WorkerError, action: RecoveryAction): RecoveryResult {
    const startTime = performance.now();
    const key = error.context;
    const currentRetries = this.retryCounts.get(key) ?? 0;

    let success = false;

    switch (action.strategy) {
      case "RETRY":
        success = currentRetries < action.maxRetries;
        if (success) {
          this.retryCounts.set(key, currentRetries + 1);
        }
        break;

      case "FALLBACK":
        success = true;
        this.retryCounts.delete(key);
        break;

      case "DEGRADE":
        success = true;
        this.retryCounts.delete(key);
        break;

      case "RESTART":
        success = true;
        this.retryCounts.delete(key);
        break;

      case "ABORT":
        success = false;
        break;
    }

    const recoveryTimeMs = performance.now() - startTime;

    if ((action.strategy === "RETRY" && !success) || action.strategy === "ABORT") {
      return { success: false, action, recoveryTimeMs, error };
    }

    return { success: true, action, recoveryTimeMs, error };
  }

  /**
   * 재시도 횟수 초기화
   */
  resetRetryCount(context: string): void {
    this.retryCounts.delete(context);
  }

  resetAllRetryCounts(): void {
    this.retryCounts.clear();
  }

  /**
   * 오류 통계
   */
  getErrorStats(): { totalErrors: number; recovered: number; failed: number; criticalCount: number } {
    return {
      totalErrors: this.errors.length,
      recovered: this.recoveryHistory.filter((r) => r.success).length,
      failed: this.recoveryHistory.filter((r) => !r.success).length,
      criticalCount: this.errors.filter((e) => e.severity === "CRITICAL").length,
    };
  }

  getRecentErrors(count = 10): WorkerError[] {
    return this.errors.slice(-count);
  }

  getRecoveryHistory(): RecoveryResult[] {
    return [...this.recoveryHistory];
  }

  clear(): void {
    this.errors = [];
    this.recoveryHistory = [];
    this.retryCounts.clear();
  }
}
