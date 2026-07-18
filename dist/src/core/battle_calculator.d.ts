/**
 * [Task 24] 실시간 전투 공식 계산기 (Battle Calculator) 샌드박스
 *
 * 공격력, 방어력, 지형 효과를 수치 대입하여 최종 데미지 가공.
 */
export interface BattleStats {
    readonly attack: number;
    readonly defense: number;
    readonly troopCount: number;
    readonly morale: number;
    readonly terrainBonus: number;
    readonly affinity: number;
}
export interface BattleResult {
    readonly damage: number;
    readonly defenderRemaining: number;
    readonly moraleLoss: number;
}
export declare class BattleCalculator {
    calculate(attacker: BattleStats, defender: BattleStats): BattleResult;
}
//# sourceMappingURL=battle_calculator.d.ts.map