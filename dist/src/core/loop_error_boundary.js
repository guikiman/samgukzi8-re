/**
 * [Task 20] 비정상 루프 예외 격리 (Error Boundary)
 *
 * 루프 도중 에러가 발생해도 브라우저가 멈추지 않고,
 * 사용자에게 복구 알림을 표시한 후 안전하게 일시정지.
 */
export class LoopErrorBoundary {
    constructor() {
        this.handler = null;
        this.consecutiveErrors = 0;
        this.maxConsecutiveErrors = 3;
    }
    setHandler(handler) {
        this.handler = handler;
    }
    async execute(context, fn) {
        try {
            const result = await fn();
            this.consecutiveErrors = 0;
            return result;
        }
        catch (err) {
            this.consecutiveErrors++;
            const error = err instanceof Error ? err : new Error(String(err));
            this.handler?.onError(error, context);
            if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
                this.handler?.onRecovery();
                return null;
            }
            return null;
        }
    }
    get hasTooManyErrors() {
        return this.consecutiveErrors >= this.maxConsecutiveErrors;
    }
    reset() {
        this.consecutiveErrors = 0;
    }
}
//# sourceMappingURL=loop_error_boundary.js.map