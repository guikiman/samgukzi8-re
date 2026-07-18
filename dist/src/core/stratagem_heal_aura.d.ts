/**
 * [B22] 전장 치유 오라 — Stratagem Heal Aura
 *
 * StratagemHealAura:
 *   1. 의술/계략 높은 무장이 광역 치료 전법 발동
 *   2. 범위 내 아군 부상병을 전투 가능 병력으로 복구
 *   3. 피로도 차감
 *   4. 3타일 반경 효과
 */
export interface HealAuraEffect {
    readonly casterId: string;
    readonly healAmount: number;
    readonly fatigueReduction: number;
    readonly range: number;
    readonly affectedUnits: HealTarget[];
}
export interface HealTarget {
    readonly unitId: string;
    readonly soldiersHealed: number;
    readonly fatigueBefore: number;
    readonly fatigueAfter: number;
}
export interface HealAuraState {
    readonly activeAuras: HealAuraEffect[];
    readonly totalHealed: number;
}
export declare class StratagemHealAura {
    private activeAuras;
    private totalHealed;
    activateHealAura(casterId: string, casterIntelligence: number, casterSkill: string[], nearbyUnits: {
        unitId: string;
        woundedSoldiers: number;
        fatigue: number;
        distance: number;
    }[]): HealAuraEffect;
    getActiveAuras(): HealAuraEffect[];
    getTotalHealed(): number;
    clear(): void;
}
//# sourceMappingURL=stratagem_heal_aura.d.ts.map