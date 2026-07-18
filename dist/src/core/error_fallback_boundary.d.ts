/**
 * [E43] 크래시 대응 예외 임시 보호막 — ErrorFallbackBoundary
 *
 * 목적: 전투 중 치명적 내부 에러 발생 시 브라우저 다운 방지 + 세이브 보존.
 *
 * 핵심 로직:
 *   1. 메인 루프에 에러 바운더리 리스너 부착
 *   2. 에러 포착 시 세이브 강제 백업 후 안전 종료
 */
export interface ErrorReport {
    readonly message: string;
    readonly stack: string;
    readonly timestamp: number;
    readonly stateSnapshot: string | null;
}
export declare class ErrorFallbackBoundary {
    private lastError;
    private onErrorCallbacks;
    /** 에러 바운더리 활성화 */
    enable(): void;
    /** 에러 바운더리 비활성화 */
    disable(): void;
    private handleError;
    private handlePromiseRejection;
    /** 상태 스냅샷 캡처 (localStorage) */
    private captureStateSnapshot;
    /** 긴급 세이브 저장 */
    emergencySave(data: string): void;
    /** 복구: 긴급 세이브 로드 */
    loadEmergencySave(): string | null;
    /** 폴백 다이얼로그 */
    private showFallbackDialog;
    /** 에러 발생 시 콜백 등록 */
    onError(callback: (report: ErrorReport) => void): void;
    private notifyCallbacks;
    /** 마지막 에러 조회 */
    getLastError(): ErrorReport | null;
}
//# sourceMappingURL=error_fallback_boundary.d.ts.map