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

export class ErrorAlertBoundaryUI {
    private overlay: HTMLDivElement | null = null;

    /** 에러 알림 표시 */
    showError(options: ErrorAlertOptions): void {
        this.hideError();

        const overlay = document.createElement('div');
        overlay.id = 'error-alert-boundary';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); z-index: 99999;
            display: flex; align-items: center; justify-content: center;
            font-family: 'Noto Sans KR', sans-serif;
        `;

        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: #1a1a2e; border: 2px solid #e94560; border-radius: 12px;
            padding: 32px; max-width: 500px; width: 90%; color: #eee;
            box-shadow: 0 0 40px rgba(233,69,96,0.3);
        `;

        dialog.innerHTML = `
            <h2 style="color:#e94560; margin:0 0 16px; font-size:20px;">⚠️ ${this.escapeHtml(options.title)}</h2>
            <p style="margin:0 0 16px; line-height:1.6; font-size:14px;">${this.escapeHtml(options.message)}</p>
            ${options.stack ? `<pre style="background:#0f0f23; padding:12px; border-radius:8px; font-size:11px; max-height:200px; overflow:auto; margin:0 0 16px;">${this.escapeHtml(options.stack)}</pre>` : ''}
            <div style="display:flex; gap:12px; justify-content:flex-end;">
                ${options.canRestart ? '<button id="error-restart-btn" style="padding:10px 24px; background:#e94560; color:#fff; border:none; border-radius:8px; cursor:pointer; font-size:14px;">게임 재시작</button>' : ''}
                ${options.canLoadSave ? '<button id="error-load-btn" style="padding:10px 24px; background:#0f3460; color:#fff; border:none; border-radius:8px; cursor:pointer; font-size:14px;">세이브 로드</button>' : ''}
                <button id="error-close-btn" style="padding:10px 24px; background:#333; color:#ccc; border:none; border-radius:8px; cursor:pointer; font-size:14px;">닫기</button>
            </div>
        `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        this.overlay = overlay;

        // 버튼 이벤트
        document.getElementById('error-restart-btn')?.addEventListener('click', () => {
            this.hideError();
            location.reload();
        });
        document.getElementById('error-load-btn')?.addEventListener('click', () => {
            this.hideError();
            // 세이브 로드 이벤트 발생
            window.dispatchEvent(new CustomEvent('load-emergency-save'));
        });
        document.getElementById('error-close-btn')?.addEventListener('click', () => {
            this.hideError();
        });
    }

    /** 에러 알림 숨기기 */
    hideError(): void {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
    }

    private escapeHtml(str: string): string {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}
