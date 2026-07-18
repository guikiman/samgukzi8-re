/**
 * [Task 16] 명령 제출 타임아웃 워치독
 *
 * 플레이어의 미입력 상태가 장시간 유지되거나 AI 서브 쓰레드가
 * 중단될 경우 디폴트 '대기(Wait)' 명령을 강제 주입.
 */
export class CommandTimeoutWatchdog {
    constructor(timeoutMs = 30000) {
        this.submitted = new Set();
        this.timerId = null;
        this.onTimeout = null;
        this.timeoutMs = timeoutMs;
    }
    registerFaction(factionId) {
        this.submitted.add(factionId);
    }
    markSubmitted(factionId) {
        this.submitted.add(factionId);
    }
    isAllSubmitted(factionIds) {
        return factionIds.every((id) => this.submitted.has(id));
    }
    reset(factionIds) {
        this.submitted.clear();
        for (const id of factionIds)
            this.submitted.add(id);
    }
    start(callback) {
        this.onTimeout = callback;
        this.timerId = setTimeout(() => {
            callback();
        }, this.timeoutMs);
    }
    cancel() {
        if (this.timerId !== null) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
    }
}
//# sourceMappingURL=command_timeout_watchdog.js.map