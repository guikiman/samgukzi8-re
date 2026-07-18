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
export declare class RallyCommandModifier {
    private readonly AURA_RANGE;
    calculateAura(rulerId: string, rulerLeadership: number, units: UnitStatus[]): CommandAura;
    applyAuraEffects(unit: UnitStatus, aura: CommandAura): {
        defense: number;
        confused: boolean;
        panicked: boolean;
        poisoned: boolean;
    };
}
//# sourceMappingURL=rally_command_modifier.d.ts.map