/**
 * [B27] 군주 지휘 아우라 — Rally Command Modifier
 *
 * RallyCommandModifier:
 *   1. 군주가 전장 참전 시 3타일 반경 지휘 아우라 투사
 *   2. 하위 부대 상태이상 회복 속도 상향
 *   3. 방어력 대폭 상향
 */

export interface CommandAura {
    readonly rulerId: string;
    readonly rulerLeadership: number;
    readonly range: number;
    readonly defenseBonus: number;
    readonly statusRecoveryBonus: number;
    readonly affectedUnits: string[];
}

export interface UnitStatus {
    readonly unitId: string;
    readonly confused: boolean;
    readonly panicked: boolean;
    readonly poisoned: boolean;
    readonly defense: number;
    readonly distance: number;
}

export class RallyCommandModifier {
    private readonly AURA_RANGE = 3;

    calculateAura(
        rulerId: string,
        rulerLeadership: number,
        units: UnitStatus[],
    ): CommandAura {
        const affectedUnits: string[] = [];
        const defenseBonus = 5 + Math.floor(rulerLeadership / 10);
        const statusRecoveryBonus = 0.3 + (rulerLeadership / 200);

        for (const unit of units) {
            if (unit.distance <= this.AURA_RANGE) {
                affectedUnits.push(unit.unitId);
            }
        }

        return {
            rulerId,
            rulerLeadership,
            range: this.AURA_RANGE,
            defenseBonus,
            statusRecoveryBonus,
            affectedUnits,
        };
    }

    applyAuraEffects(unit: UnitStatus, aura: CommandAura): { defense: number; confused: boolean; panicked: boolean; poisoned: boolean } {
        if (aura.affectedUnits.includes(unit.unitId)) {
            const defense = unit.defense + aura.defenseBonus;
            const recoverChance = aura.statusRecoveryBonus;
            return {
                defense,
                confused: unit.confused && Math.random() >= recoverChance,
                panicked: unit.panicked && Math.random() >= recoverChance,
                poisoned: unit.poisoned && Math.random() >= recoverChance,
            };
        }
        return { defense: unit.defense, confused: unit.confused, panicked: unit.panicked, poisoned: unit.poisoned };
    }
}
