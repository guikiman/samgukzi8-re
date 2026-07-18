/**
 * [15] 비정상 턴 고착(데드락) 탐지 및 자가 복구 워치독 — DeadlockWatchdog
 *
 * DeadlockWatchdog:
 *   1. 무장 AI 연산 지연 등으로 턴이 3초 이상 넘어가지 않을 경우 감지
 *   2. 해당 무장의 행동을 '휴식(REST)'으로 강제 전환
 *   3. 턴을 안전하게 스킵하고 다음 무장으로 진행
 *   4. 데드락 발생 이력 추적 및 복구 로그 기록
 *   5. 연속 데드락 발생 시 강제 턴 종료 트리거
 */
const DEFAULT_CONFIG = {
    stallTimeoutMs: 3000,
    maxConsecutiveStalls: 5,
    checkIntervalMs: 500,
};
// ============================================================
// DeadlockWatchdog
// ============================================================
export class DeadlockWatchdog {
    constructor(restOfficer, forceEndTurn, isOfficerStalled, config) {
        this.activeTimers = new Map();
        this.stallHistory = [];
        this.consecutiveStalls = 0;
        this.isArmed = false;
        this.watchInterval = null;
        this.deadlockEvents = [];
        this.restOfficer = restOfficer;
        this.forceEndTurn = forceEndTurn;
        this.isOfficerStalled = isOfficerStalled;
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    /**
     * 특정 무장의 타이머를 시작한다.
     * 무장이 행동을 시작할 때 호출되어 데드락 감시 시작.
     */
    watch(officerId) {
        if (!this.isArmed)
            return;
        // 기존 타이머 정리
        this.stopWatching(officerId);
        const startTime = Date.now();
        this.activeTimers.set(officerId, startTime);
        console.log(`[Watchdog] Watching ${officerId} (timeout: ${this.config.stallTimeoutMs}ms)`);
    }
    /**
     * 특정 무장의 타이머를 중지한다.
     * 무장이 행동을 완료했을 때 호출.
     */
    stopWatching(officerId) {
        const startTime = this.activeTimers.get(officerId);
        if (startTime !== undefined) {
            const duration = Date.now() - startTime;
            this.activeTimers.delete(officerId);
            if (duration >= this.config.stallTimeoutMs) {
                this.stallHistory.push({
                    officerId,
                    stalledSince: startTime,
                    stallDurationMs: duration,
                    resolvedBy: 'OFFICER_COMPLETED',
                });
                console.log(`[Watchdog] ${officerId} completed after stall (${duration}ms)`);
            }
        }
    }
    /**
     * 워치독을 활성화한다.
     */
    arm() {
        if (this.isArmed)
            return;
        this.isArmed = true;
        this.watchInterval = setInterval(() => {
            this.checkForDeadlocks();
        }, this.config.checkIntervalMs);
        console.log('[Watchdog] Armed and monitoring');
    }
    /**
     * 워치독을 비활성화한다.
     */
    disarm() {
        this.isArmed = false;
        if (this.watchInterval !== null) {
            clearInterval(this.watchInterval);
            this.watchInterval = null;
        }
        this.activeTimers.clear();
        console.log('[Watchdog] Disarmed');
    }
    /**
     * 데드락 상태를 점검하고 필요한 경우 복구 조치를 취한다.
     */
    checkForDeadlocks() {
        if (!this.isArmed)
            return;
        const now = Date.now();
        const stalledOfficers = [];
        for (const [officerId, startTime] of this.activeTimers.entries()) {
            const elapsed = now - startTime;
            if (elapsed >= this.config.stallTimeoutMs) {
                stalledOfficers.push(officerId);
                // 1. 데드락 기록
                this.stallHistory.push({
                    officerId,
                    stalledSince: startTime,
                    stallDurationMs: elapsed,
                    resolvedBy: 'TIMEOUT',
                });
                // 2. 무장 행동을 '휴식'으로 강제 전환
                this.restOfficer(officerId);
                // 3. 타이머 정리
                this.activeTimers.delete(officerId);
                console.log(`[Watchdog] DEADLOCK: ${officerId} stalled for ${elapsed}ms -> forced REST`);
            }
        }
        if (stalledOfficers.length > 0) {
            this.consecutiveStalls += stalledOfficers.length;
            // 연속 데드락이 임계치를 초과하면 강제 턴 종료
            if (this.consecutiveStalls >= this.config.maxConsecutiveStalls) {
                console.log(`[Watchdog] Consecutive stalls (${this.consecutiveStalls}) exceeded limit -> force end turn`);
                this.deadlockEvents.push({
                    timestamp: now,
                    stalledOfficers,
                    totalStalls: this.consecutiveStalls,
                    forceEndTurn: true,
                });
                this.forceEndTurn();
                this.consecutiveStalls = 0;
            }
            else {
                this.deadlockEvents.push({
                    timestamp: now,
                    stalledOfficers,
                    totalStalls: this.consecutiveStalls,
                    forceEndTurn: false,
                });
            }
        }
        else {
            // 정상 진행 중이면 연속 데드락 카운터 리셋
            this.consecutiveStalls = 0;
        }
    }
    /**
     * 현재 감시 중인 무장 목록을 반환한다.
     */
    getWatchedOfficers() {
        return Array.from(this.activeTimers.keys());
    }
    /**
     * 데드락 이력을 반환한다.
     */
    getStallHistory() {
        return [...this.stallHistory];
    }
    /**
     * 데드락 이벤트 목록을 반환한다.
     */
    getDeadlockEvents() {
        return [...this.deadlockEvents];
    }
    /**
     * 현재 연속 데드락 횟수를 반환한다.
     */
    getConsecutiveStalls() {
        return this.consecutiveStalls;
    }
    /**
     * 워치독이 현재 활성 상태인지 반환한다.
     */
    isActive() {
        return this.isArmed;
    }
    /**
     * 설정을 업데이트한다.
     */
    updateConfig(config) {
        this.config = { ...this.config, ...config };
    }
    /**
     * 상태를 초기화한다.
     */
    clear() {
        this.disarm();
        this.stallHistory = [];
        this.deadlockEvents = [];
        this.consecutiveStalls = 0;
    }
}
//# sourceMappingURL=deadlock_watchdog.js.map