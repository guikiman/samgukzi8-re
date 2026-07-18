/**
 * [20] 다중 턴 장기 서사 체인 이벤트 전용 상태 스택 관리자
 *
 * NarrativeStackManager:
 *   - 중첩 트랜잭션 상태 스택(Nested Transaction Stack)
 *   - 예외 조건(타겟 사망/도시 함락) → Rollback + 우회 이벤트 강제 삽입
 *   - ex) 삼고초려 시 제갈량 사망 시 서서 등용 이벤트로 우회
 */
export class NarrativeStackManager {
    constructor() {
        this.stack = [];
    }
    /**
     * [20] 새 서사 체인 시작 (push)
     */
    beginNarrative(narrative) {
        this.stack.push(narrative);
    }
    /**
     * [20] 현재 서사 단계 진행
     */
    advance() {
        const current = this.stack[this.stack.length - 1];
        if (!current)
            return null;
        const event = current.events[current.eventIndex];
        if (!event) {
            this.completeCurrent();
            return null;
        }
        const updated = {
            ...current,
            eventIndex: current.eventIndex + 1,
        };
        this.stack[this.stack.length - 1] = updated;
        return event;
    }
    /**
     * [20] 예외 조건 시 Rollback + 우회
     *
     * 타겟 장수 사망 등 예외 발생:
     * - rollbackOnFailure=true → 현재 프레임 롤백
     * - fallbackEvent 존재 → 우회 이벤트 강제 삽입
     */
    handleException(officerDead, cityFallen) {
        const current = this.stack[this.stack.length - 1];
        if (!current)
            return null;
        const shouldRollback = current.rollbackOnFailure &&
            (officerDead || cityFallen);
        if (shouldRollback) {
            // 현재 프레임 롤백
            const rolledBack = {
                ...current,
                eventIndex: Math.max(0, current.eventIndex - 1),
            };
            this.stack[this.stack.length - 1] = rolledBack;
            // 우회 이벤트가 있으면 반환
            if (current.fallbackEvent) {
                return current.fallbackEvent;
            }
        }
        return null;
    }
    getCurrentFrame() {
        return this.stack[this.stack.length - 1] ?? null;
    }
    isNarrativeActive() { return this.stack.length > 0; }
    completeCurrent() {
        this.stack.pop();
    }
}
//# sourceMappingURL=narrative_stack_manager.js.map