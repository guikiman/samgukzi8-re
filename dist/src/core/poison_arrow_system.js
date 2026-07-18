/**
 * [14] 맹독 화살 시스템 — Poison Arrow System
 *
 * 맹독 화살 타격 시 무장의 병상 발생 플래그 및
 * 매 턴 병력 감소 계수를 지수 로그 감쇠로 연산
 */
export class PoisonArrowSystem {
    constructor() {
        this.poisoned = new Map();
    }
    /**
     * 독 화살 명중
     *
     * @param poisonLevel 독 레벨 (1~10, 높을수록 강력)
     */
    applyPoison(officerId, poisonLevel, currentTurn) {
        const baseLoss = Math.floor(50 * (poisonLevel / 10));
        const state = {
            officerId,
            poisonLevel: Math.max(1, Math.min(10, poisonLevel)),
            startTurn: currentTurn,
            currentTurn,
            baseTroopLoss: baseLoss,
            isActive: true,
        };
        this.poisoned.set(officerId, state);
        return state;
    }
    /**
     * 매 턴 독 피해 처리
     *
     * 공식: loss = baseLoss × exp(-decayRate × elapsedTurns)
     *   - decayRate = 0.3 (독 자연 소멸 속도)
     *   - elapsedTurns = currentTurn - startTurn
     *   - loss는 턴이 지날수록 지수적으로 감소
     */
    processPoisonTurn(officerId, currentTurn) {
        const state = this.poisoned.get(officerId);
        if (!state || !state.isActive)
            return 0;
        state.currentTurn = currentTurn;
        const elapsedTurns = currentTurn - state.startTurn;
        const decayRate = 0.3;
        const loss = Math.floor(state.baseTroopLoss * Math.exp(-decayRate * elapsedTurns));
        // 5턴 이상 경과 시 자연 치유
        if (elapsedTurns >= 5 || loss < 1) {
            state.isActive = false;
            this.poisoned.delete(officerId);
        }
        return Math.max(0, loss);
    }
    /**
     * 특정 무장의 중독 상태 확인
     */
    isPoisoned(officerId) {
        return this.poisoned.has(officerId) && this.poisoned.get(officerId).isActive;
    }
    /**
     * 중독 상태 조회
     */
    getPoisonState(officerId) {
        return this.poisoned.get(officerId) ?? null;
    }
    /**
     * 해독 치료
     */
    curePoison(officerId) {
        const state = this.poisoned.get(officerId);
        if (!state)
            return false;
        state.isActive = false;
        this.poisoned.delete(officerId);
        return true;
    }
    /**
     * 예상 피해량 계산 (실행 전 예측)
     */
    predictDamage(officerId, currentTurn) {
        const state = this.poisoned.get(officerId);
        if (!state || !state.isActive)
            return 0;
        const elapsedTurns = currentTurn - state.startTurn;
        return Math.max(0, Math.floor(state.baseTroopLoss * Math.exp(-0.3 * elapsedTurns)));
    }
    getAllPoisoned() {
        return Array.from(this.poisoned.values()).filter(p => p.isActive);
    }
    reset() {
        this.poisoned.clear();
    }
}
//# sourceMappingURL=poison_arrow_system.js.map