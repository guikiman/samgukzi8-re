/**
 * [4] TurnTimeoutGuard — 타임아웃 처리기
 *
 * 목적: AI 자동 위임.
 */
export class TurnTimeoutGuard {
    check(timeout, action) {
        setTimeout(action, timeout);
    }
}
//# sourceMappingURL=turn_timeout_guard.js.map