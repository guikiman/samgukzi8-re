/**
 * [E3] 보수(성벽) 보수 로직 — Wall Repair System
 *
 * WallRepairSystem:
 *   1. 도시 방어력(성벽 내구도) 수치화
 *   2. 공성전 발생 시 성문/성벽 최대 내구도(HP)와 방어 피해 흡수율 결정
 *   3. 보수 명령 시 매 턴 일정량 수리
 *   4. 보수 효율 = 무장 정치력 × (1 + 공병 특기 보정)
 */
export interface CityWall {
    readonly cityId: string;
    maxDurability: number;
    currentDurability: number;
    defenseAbsorption: number;
}
export interface RepairResult {
    readonly repairAmount: number;
    readonly newDurability: number;
    readonly goldCost: number;
    readonly isFullyRepaired: boolean;
}
export interface SiegeDamageResult {
    readonly rawDamage: number;
    readonly absorbedDamage: number;
    readonly finalDamage: number;
    readonly remainingDurability: number;
    readonly wallBreached: boolean;
}
export declare class WallRepairSystem {
    repair(wall: CityWall, officerPolitics: number, hasEngineerSkill: boolean, goldBudget: number): RepairResult;
    applySiegeDamage(wall: CityWall, rawDamage: number): SiegeDamageResult;
    upgradeWall(wall: CityWall, goldSpent: number): void;
}
//# sourceMappingURL=wall_repair_system.d.ts.map