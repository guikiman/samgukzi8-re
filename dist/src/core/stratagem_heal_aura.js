/**
 * [B22] 전장 치유 오라 — Stratagem Heal Aura
 *
 * StratagemHealAura:
 *   1. 의술/계략 높은 무장이 광역 치료 전법 발동
 *   2. 범위 내 아군 부상병을 전투 가능 병력으로 복구
 *   3. 피로도 차감
 *   4. 3타일 반경 효과
 */
export class StratagemHealAura {
    constructor() {
        this.activeAuras = [];
        this.totalHealed = 0;
    }
    activateHealAura(casterId, casterIntelligence, casterSkill, nearbyUnits) {
        const isHealer = casterSkill.includes('MEDICINE') || casterSkill.includes('STRATEGY');
        const baseHealPercent = isHealer ? 0.3 : 0.15;
        const intBonus = casterIntelligence / 200;
        const healPercent = Math.min(0.5, baseHealPercent + intBonus);
        const range = 3;
        const affectedUnits = [];
        let totalHealedThisAura = 0;
        for (const unit of nearbyUnits) {
            if (unit.distance > range)
                continue;
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
        const effect = {
            casterId, healAmount: totalHealedThisAura,
            fatigueReduction: Math.floor(30 * (1 + intBonus)),
            range, affectedUnits,
        };
        this.activeAuras.push(effect);
        this.totalHealed += totalHealedThisAura;
        return effect;
    }
    getActiveAuras() {
        return [...this.activeAuras];
    }
    getTotalHealed() {
        return this.totalHealed;
    }
    clear() {
        this.activeAuras = [];
        this.totalHealed = 0;
    }
}
//# sourceMappingURL=stratagem_heal_aura.js.map