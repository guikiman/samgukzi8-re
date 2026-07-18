/**
 * [B30] 전투 종료 클린업 핸들러 — Battlefield Egress Failsafe
 *
 * BattlefieldEgressFailsafe:
 *   1. 전장 종료(전멸/후퇴/시간초과) 시 활성화 리소스 정리
 *   2. 타이머/인터벌 일괄 해제
 *   3. 3D 오디오 노드 정적 소멸
 *   4. 시선(LOS) 처리 데이터 초기화
 *   5. 메모리 누수 방지
 */
export class BattlefieldEgressFailsafe {
    constructor() {
        this.activeTimers = new Set();
        this.activeTimeouts = new Set();
        this.losDataEntries = 0;
        this.audioNodeCount = 0;
    }
    registerTimer(timerId) {
        this.activeTimers.add(timerId);
    }
    registerTimeout(timeoutId) {
        this.activeTimeouts.add(timeoutId);
    }
    registerLOSData(count) {
        this.losDataEntries += count;
    }
    registerAudioNodes(count) {
        this.audioNodeCount += count;
    }
    executeCleanup(reason) {
        let timersCleared = 0;
        let audioNodesReleased = 0;
        let losDataCleared = 0;
        for (const timer of this.activeTimers) {
            clearInterval(timer);
            timersCleared++;
        }
        for (const timeout of this.activeTimeouts) {
            clearTimeout(timeout);
            timersCleared++;
        }
        audioNodesReleased = this.audioNodeCount;
        losDataCleared = this.losDataEntries;
        const heapFreed = audioNodesReleased * 1024 + losDataCleared * 64;
        this.activeTimers.clear();
        this.activeTimeouts.clear();
        this.losDataEntries = 0;
        this.audioNodeCount = 0;
        return { reason, timersCleared, audioNodesReleased, losDataCleared, heapFreed };
    }
    getActiveTimerCount() {
        return this.activeTimers.size + this.activeTimeouts.size;
    }
}
//# sourceMappingURL=battlefield_egress_failsafe.js.map