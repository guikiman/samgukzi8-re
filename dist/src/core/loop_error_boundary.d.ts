/**
 * [Task 20] 비정상 루프 예외 격리 (Error Boundary)
 *
 * 루프 도중 에러가 발생해도 브라우저가 멈추지 않고,
 * 사용자에게 복구 알림을 표시한 후 안전하게 일시정지.
 */
export interface ErrorBoundaryHandler {
    onError(error: Error, context: string): void;
    onRecovery(): void;
}
export declare class LoopErrorBoundary {
    private handler;
    private consecutiveErrors;
    private readonly maxConsecutiveErrors;
    setHandler(handler: ErrorBoundaryHandler): void;
    execute<T>(context: string, fn: () => Promise<T>): Promise<T | null>;
    get hasTooManyErrors(): boolean;
    reset(): void;
}
//# sourceMappingURL=loop_error_boundary.d.ts.map