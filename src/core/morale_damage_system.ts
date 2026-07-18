/**
 * [Task 27] 사기(Morale) 및 병력수 동적 감쇄 시스템
 *
 * 데미지 연산 후 잔존 병력 수에 따라 부대의 사기치가
 * 하락하거나 궤멸 처리 상태를 동적 업데이트.
 */

export interface UnitMoraleState {
  readonly currentMorale: number;
  readonly maxMorale: number;
  readonly troopCount: number;
  readonly maxTroop: number;
  readonly isRouted: boolean;
}

export class MoraleDamageSystem {
  applyDamage(state: UnitMoraleState, damage: number, moraleLoss: number): UnitMoraleState {
    const newTroop = Math.max(0, state.troopCount - damage);
    const newMorale = Math.max(0, state.currentMorale - moraleLoss);
    const isRouted = newMorale <= 0 || newTroop <= 0;

    return { ...state, currentMorale: newMorale, troopCount: newTroop, isRouted };
  }

  recoverMorale(state: UnitMoraleState, recovery: number): UnitMoraleState {
    const newMorale = Math.min(state.maxMorale, state.currentMorale + recovery);
    return { ...state, currentMorale: newMorale };
  }

  replenishTroops(state: UnitMoraleState, replenish: number): UnitMoraleState {
    const newTroop = Math.min(state.maxTroop, state.troopCount + replenish);
    return { ...state, troopCount: newTroop };
  }
}
