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
export declare class MoraleDamageSystem {
    applyDamage(state: UnitMoraleState, damage: number, moraleLoss: number): UnitMoraleState;
    recoverMorale(state: UnitMoraleState, recovery: number): UnitMoraleState;
    replenishTroops(state: UnitMoraleState, replenish: number): UnitMoraleState;
}
//# sourceMappingURL=morale_damage_system.d.ts.map