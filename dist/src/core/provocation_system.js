/**
 * [B28] 도발 시스템 — Provocation System
 *
 * ProvocationSystem:
 *   1. 지력 높고 '도발' 특기 장수가 적장 지정
 *   2. 적장의 의리도 + 충동성 성향 판정
 *   3. 성공 시 적장 제어 무력화 + 자신 위치로 강제 이동
 *   4. 2턴 지속
 */
export class ProvocationSystem {
    constructor() {
        this.provokedUnits = new Map();
    }
    attemptProvocation(casterId, casterIntelligence, hasProvokeSkill, targetId, targetLoyalty, targetImpulsiveness, targetPosition, casterPosition) {
        if (!hasProvokeSkill) {
            return { casterId, targetId, success: false, duration: 0, description: '도발 특기 없음' };
        }
        const baseChance = casterIntelligence / 200;
        const loyaltyPenalty = targetLoyalty / 200;
        const impulseBonus = targetImpulsiveness / 100;
        const successChance = Math.max(0.1, Math.min(0.9, baseChance - loyaltyPenalty + impulseBonus));
        const success = Math.random() < successChance;
        if (success) {
            this.provokedUnits.set(targetId, {
                targetId,
                provokedBy: casterId,
                remainingTurns: 2,
                originalPosition: targetPosition,
                forcedMove: true,
            });
        }
        return {
            casterId, targetId, success, duration: success ? 2 : 0,
            description: success
                ? `${targetId}가 도발에 넘어감! (확률: ${Math.round(successChance * 100)}%)`
                : `도발 실패 (확률: ${Math.round(successChance * 100)}%)`,
        };
    }
    isProvoked(unitId) {
        return this.provokedUnits.has(unitId);
    }
    getProvokedState(unitId) {
        return this.provokedUnits.get(unitId) ?? null;
    }
    processTurnEnd() {
        const expired = [];
        const active = [];
        for (const [id, state] of this.provokedUnits) {
            const newRemaining = state.remainingTurns - 1;
            if (newRemaining <= 0) {
                expired.push(id);
            }
            else {
                this.provokedUnits.set(id, { ...state, remainingTurns: newRemaining });
                active.push(this.provokedUnits.get(id));
            }
        }
        for (const id of expired) {
            this.provokedUnits.delete(id);
        }
        return active;
    }
    clear() {
        this.provokedUnits.clear();
    }
}
//# sourceMappingURL=provocation_system.js.map