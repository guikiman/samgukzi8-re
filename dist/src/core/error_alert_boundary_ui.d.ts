/**
 * [E56] 에러 알림 UI 바운더리 — ErrorAlertBoundaryUI
 *
 * 목적: 치명적 오류 발생 시 사용자에게 시각적 알림을 표시하고
 *       게임 재시작/세이브 로드 선택권 제공.
 *
 * 핵심 로직:
 *   1. 오류 발생 시 오버레이 UI 생성
 *   2. 재시작/로드 버튼 제공
 */
export interface ErrorAlertOptions {
    readonly title: string;
    readonly message: string;
    readonly stack?: string;
    readonly canRestart: boolean;
    readonly canLoadSave: boolean;
}
export declare class ErrorAlertBoundaryUI {
    private overlay;
    /** 에러 알림 표시 */
    showError(options: ErrorAlertOptions): void;
    /** 에러 알림 숨기기 */
    hideError(): void;
    private escapeHtml;
}
//# sourceMappingURL=error_alert_boundary_ui.d.ts.map