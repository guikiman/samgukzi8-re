/**
 * [Task 27] 사기(Morale) 및 병력수 동적 감쇄 시스템
 *
 * 데미지 연산 후 잔존 병력 수에 따라 부대의 사기치가
 * 하락하거나 궤멸 처리 상태를 동적 업데이트.
 */
export class MoraleDamageSystem {
    applyDamage(state, damage, moraleLoss) {
        const newTroop = Math.max(0, state.troopCount - damage);
        const newMorale = Math.max(0, state.currentMorale - moraleLoss);
        const isRouted = newMorale <= 0 || newTroop <= 0;
        return { ...state, currentMorale: newMorale, troopCount: newTroop, isRouted };
    }
    recoverMorale(state, recovery) {
        const newMorale = Math.min(state.maxMorale, state.currentMorale + recovery);
        return { ...state, currentMorale: newMorale };
    }
    replenishTroops(state, replenish) {
        const newTroop = Math.min(state.maxTroop, state.troopCount + replenish);
        return { ...state, troopCount: newTroop };
    }
}
//# sourceMappingURL=morale_damage_system.js.map