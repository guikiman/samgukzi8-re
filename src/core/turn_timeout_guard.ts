/**
 * [4] TurnTimeoutGuard — 타임아웃 처리기
 * 
 * 목적: AI 자동 위임.
 */
export class TurnTimeoutGuard {
    public check(timeout: number, action: () => void): void {
        setTimeout(action, timeout);
    }
}
