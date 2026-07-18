/**
 * [14] 플레이어 수동 턴 종료 인터럽트 핸들러 — PlayerEndTurnInterceptor
 *
 * PlayerEndTurnInterceptor:
 *   1. 유저가 UI 상에서 '턴 종료' 버튼을 눌렀을 때 즉시 현재 이벤트 정산
 *   2. 처리 중이던 명령 큐의 남은 작업을 강제 플러시
 *   3. 현재 활성화된 무장의 제어권을 해제하고 다음 대기 무장으로 이양
 *   4. 턴 타임아웃 가드와 연동하여 이중 호출 방지
 *   5. 이벤트 리스너 시스템을 통해 UI 레이어와 통신
 */
export class PlayerEndTurnInterceptor {
    constructor(flushCommands, advanceTurn, emitEvent) {
        this.isInterrupted = false;
        this.lastEndTurnTimestamp = 0;
        this.interruptHistory = [];
        this.COOLDOWN_MS = 500; // 더블클릭 방지
        this.flushCommands = flushCommands;
        this.advanceTurn = advanceTurn;
        this.emitEvent = emitEvent;
    }
    /**
     * 플레이어의 턴 종료 요청을 처리한다.
     * @param reason 종료 사유
     * @param forceFlush 강제 플러시 여부
     * @returns 처리 결과
     */
    requestEndTurn(reason = 'PLAYER_REQUEST', forceFlush = true) {
        // 더블클릭 방지: 쿨다운 내 중복 요청 차단
        const now = Date.now();
        if (this.isInterrupted || (now - this.lastEndTurnTimestamp < this.COOLDOWN_MS)) {
            return {
                success: false,
                flushedCommands: 0,
                skippedOfficers: 0,
                reason,
                timestamp: now,
                remainingQueue: 0,
            };
        }
        this.isInterrupted = true;
        // 1. 명령 큐 플러시
        const context = { logger: (msg) => console.log(`[EndTurn] ${msg}`) };
        const results = this.flushCommands(context);
        const flushedCount = results.length;
        // 2. 이벤트 발송
        this.emitEvent({
            id: `endturn_${now}`,
            type: 'END_TURN',
            payload: {
                reason,
                flushedCommands: flushedCount,
                timestamp: now,
            },
            timestamp: now,
        });
        // 3. 턴 진행
        this.advanceTurn();
        const result = {
            success: true,
            flushedCommands: flushedCount,
            skippedOfficers: 0,
            reason,
            timestamp: now,
            remainingQueue: 0,
        };
        this.interruptHistory.push(result);
        this.lastEndTurnTimestamp = now;
        this.isInterrupted = false;
        return result;
    }
    /**
     * 현재 인터럽트 상태를 반환한다.
     */
    isCurrentlyInterrupted() {
        return this.isInterrupted;
    }
    /**
     * 마지막 턴 종료 시각을 반환한다.
     */
    getLastEndTurnTimestamp() {
        return this.lastEndTurnTimestamp;
    }
    /**
     * 인터럽트 이력을 반환한다.
     */
    getInterruptHistory() {
        return [...this.interruptHistory];
    }
    /**
     * 상태를 초기화한다.
     */
    clear() {
        this.isInterrupted = false;
        this.lastEndTurnTimestamp = 0;
        this.interruptHistory = [];
    }
}
//# sourceMappingURL=player_end_turn_interceptor.js.map