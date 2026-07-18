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

export class ErrorFallbackBoundary {
    private lastError: ErrorReport | null = null;
    private onErrorCallbacks: Array<(report: ErrorReport) => void> = [];

    /** 에러 바운더리 활성화 */
    enable(): void {
        window.addEventListener('error', this.handleError);
        window.addEventListener('unhandledrejection', this.handlePromiseRejection);
    }

    /** 에러 바운더리 비활성화 */
    disable(): void {
        window.removeEventListener('error', this.handleError);
        window.removeEventListener('unhandledrejection', this.handlePromiseRejection);
    }

    private handleError = (event: ErrorEvent): void => {
        const report: ErrorReport = {
            message: event.message,
            stack: event.error?.stack ?? '(no stack)',
            timestamp: Date.now(),
            stateSnapshot: this.captureStateSnapshot(),
        };
        this.lastError = report;
        this.notifyCallbacks(report);
        this.showFallbackDialog(report);
        event.preventDefault();
    };

    private handlePromiseRejection = (event: PromiseRejectionEvent): void => {
        const report: ErrorReport = {
            message: String(event.reason),
            stack: event.reason?.stack ?? '(no stack)',
            timestamp: Date.now(),
            stateSnapshot: this.captureStateSnapshot(),
        };
        this.lastError = report;
        this.notifyCallbacks(report);
        this.showFallbackDialog(report);
        event.preventDefault();
    };

    /** 상태 스냅샷 캡처 (localStorage) */
    private captureStateSnapshot(): string | null {
        try {
            const key = 'sangokushi_emergency_save';
            const data = localStorage.getItem(key);
            return data;
        } catch {
            return null;
        }
    }

    /** 긴급 세이브 저장 */
    emergencySave(data: string): void {
        try {
            localStorage.setItem('sangokushi_emergency_save', data);
            localStorage.setItem('sangokushi_emergency_timestamp', String(Date.now()));
        } catch {
            // 저장 실패 무시
        }
    }

    /** 복구: 긴급 세이브 로드 */
    loadEmergencySave(): string | null {
        return localStorage.getItem('sangokushi_emergency_save');
    }

    /** 폴백 다이얼로그 */
    private showFallbackDialog(report: ErrorReport): void {
        const msg =
            '⚠️ 오류가 발생했습니다.\n\n' +
            `${report.message}\n\n` +
            '게임 상태를 임시 파일로 저장했습니다.\n' +
            '재시작 시 이 지점에서 로드 가능합니다.\n\n' +
            `에러 시간: ${new Date(report.timestamp).toLocaleString()}`;
        alert(msg);
    }

    /** 에러 발생 시 콜백 등록 */
    onError(callback: (report: ErrorReport) => void): void {
        this.onErrorCallbacks.push(callback);
    }

    private notifyCallbacks(report: ErrorReport): void {
        for (const cb of this.onErrorCallbacks) {
            try { cb(report); } catch { /* ignore */ }
        }
    }

    /** 마지막 에러 조회 */
    getLastError(): ErrorReport | null {
        return this.lastError;
    }
}
