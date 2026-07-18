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
    maxDurability: number;      // 최대 내구도
    currentDurability: number;  // 현재 내구도
    defenseAbsorption: number;  // 방어 피해 흡수율 (0~1)
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

export class WallRepairSystem {
    repair(
        wall: CityWall,
        officerPolitics: number,
        hasEngineerSkill: boolean,
        goldBudget: number,
    ): RepairResult {
        const skillBonus = hasEngineerSkill ? 0.5 : 0;
        const efficiency = (officerPolitics / 100 + skillBonus);
        const maxRepair = Math.floor(efficiency * 15);

        const damage = wall.maxDurability - wall.currentDurability;
        const repairAmount = Math.min(maxRepair, damage, goldBudget);

        wall.currentDurability += repairAmount;

        return {
            repairAmount,
            newDurability: wall.currentDurability,
            goldCost: repairAmount,
            isFullyRepaired: wall.currentDurability >= wall.maxDurability,
        };
    }

    applySiegeDamage(wall: CityWall, rawDamage: number): SiegeDamageResult {
        const absorptionRate = wall.defenseAbsorption * (wall.currentDurability / wall.maxDurability);
        const absorbedDamage = Math.floor(rawDamage * absorptionRate);
        const finalDamage = rawDamage - absorbedDamage;
        const newDurability = Math.max(0, wall.currentDurability - finalDamage);

        wall.currentDurability = newDurability;

        return {
            rawDamage,
            absorbedDamage,
            finalDamage,
            remainingDurability: newDurability,
            wallBreached: newDurability <= 0,
        };
    }

    upgradeWall(wall: CityWall, goldSpent: number): void {
        const upgrade = Math.floor(goldSpent / 100);
        wall.maxDurability += upgrade;
        wall.currentDurability += upgrade;
        wall.defenseAbsorption = Math.min(0.8, wall.defenseAbsorption + 0.01 * upgrade);
    }
}
