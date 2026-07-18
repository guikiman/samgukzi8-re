/**
 * [A3] 동적 세력 밸런서 — Dynamic Faction Balancer
 *
 * DynamicFactionBalancer:
 *   1. 세력별 무장 수, 자원량, 위협 수준 분석
 *   2. 중약소 세력 동적 보너스 (징병 속도, 내정 효율)
 *   3. 1위 세력 디버프 (연합/반감)
 *   4. 실시간 밸런스 조정
 */
export class DynamicFactionBalancer {
    constructor() {
        this.metrics = new Map();
        this.bonuses = new Map();
        this.BONUS_POWER_THRESHOLD = 0.3;
        this.PENALTY_POWER_THRESHOLD = 0.6;
    }
    updateMetrics(allFactions) {
        this.metrics.clear();
        const sorted = [...allFactions].sort((a, b) => b.powerRank - a.powerRank);
        const totalPower = sorted.reduce((sum, f) => sum + f.powerRank, 0);
        for (const faction of sorted) {
            this.metrics.set(faction.factionId, faction);
        }
        this.calculateBonuses(sorted, totalPower);
    }
    calculateBonuses(sorted, totalPower) {
        this.bonuses.clear();
        const topPower = sorted[0]?.powerRank ?? 1;
        for (const faction of sorted) {
            const powerRatio = faction.powerRank / Math.max(1, topPower);
            let recruitmentBonus = 1.0;
            let domesticBonus = 1.0;
            let moraleBonus = 1.0;
            let diplomacyBonus = 1.0;
            if (powerRatio < this.BONUS_POWER_THRESHOLD) {
                const weaknessFactor = (this.BONUS_POWER_THRESHOLD - powerRatio) / this.BONUS_POWER_THRESHOLD;
                recruitmentBonus = 1.0 + weaknessFactor * 0.5;
                domesticBonus = 1.0 + weaknessFactor * 0.3;
                moraleBonus = 1.0 + weaknessFactor * 0.2;
            }
            if (powerRatio > this.PENALTY_POWER_THRESHOLD && faction.powerRank === topPower) {
                const penaltyFactor = (powerRatio - this.PENALTY_POWER_THRESHOLD) / (1 - this.PENALTY_POWER_THRESHOLD);
                diplomacyBonus = 1.0 - penaltyFactor * 0.3;
                moraleBonus = 1.0 - penaltyFactor * 0.1;
            }
            this.bonuses.set(faction.factionId, {
                factionId: faction.factionId,
                recruitmentBonus: Math.round(recruitmentBonus * 100) / 100,
                domesticBonus: Math.round(domesticBonus * 100) / 100,
                moraleBonus: Math.round(moraleBonus * 100) / 100,
                diplomacyBonus: Math.round(diplomacyBonus * 100) / 100,
            });
        }
    }
    getBonus(factionId) {
        return this.bonuses.get(factionId) ?? null;
    }
    getMetric(factionId) {
        return this.metrics.get(factionId) ?? null;
    }
    getAllBonuses() {
        return Array.from(this.bonuses.values());
    }
    getAllMetrics() {
        return Array.from(this.metrics.values());
    }
    clear() {
        this.metrics.clear();
        this.bonuses.clear();
    }
}
//# sourceMappingURL=dynamic_faction_balancer.js.map