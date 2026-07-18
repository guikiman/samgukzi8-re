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

export class StratagemHealAura {
    private activeAuras: HealAuraEffect[] = [];
    private totalHealed = 0;

    activateHealAura(
        casterId: string,
        casterIntelligence: number,
        casterSkill: string[],
        nearbyUnits: { unitId: string; woundedSoldiers: number; fatigue: number; distance: number }[],
    ): HealAuraEffect {
        const isHealer = casterSkill.includes('MEDICINE') || casterSkill.includes('STRATEGY');
        const baseHealPercent = isHealer ? 0.3 : 0.15;
        const intBonus = casterIntelligence / 200;
        const healPercent = Math.min(0.5, baseHealPercent + intBonus);

        const range = 3;
        const affectedUnits: HealTarget[] = [];
        let totalHealedThisAura = 0;

        for (const unit of nearbyUnits) {
            if (unit.distance > range) continue;
            const soldiersHealed = Math.floor(unit.woundedSoldiers * healPercent);
            const fatigueReduction = Math.floor(unit.fatigue * 0.3);
            if (soldiersHealed > 0 || fatigueReduction > 0) {
                affectedUnits.push({
                    unitId: unit.unitId,
                    soldiersHealed,
                    fatigueBefore: unit.fatigue,
                    fatigueAfter: Math.max(0, unit.fatigue - fatigueReduction),
                });
                totalHealedThisAura += soldiersHealed;
            }
        }

        const effect: HealAuraEffect = {
            casterId, healAmount: totalHealedThisAura,
            fatigueReduction: Math.floor(30 * (1 + intBonus)),
            range, affectedUnits,
        };

        this.activeAuras.push(effect);
        this.totalHealed += totalHealedThisAura;
        return effect;
    }

    getActiveAuras(): HealAuraEffect[] {
        return [...this.activeAuras];
    }

    getTotalHealed(): number {
        return this.totalHealed;
    }

    clear(): void {
        this.activeAuras = [];
        this.totalHealed = 0;
    }
}
