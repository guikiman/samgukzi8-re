export class SpouseSynergySystem {
    calculateCombatSync(husbandMight, wifeMight, marriageDuration) {
        const base = (husbandMight + wifeMight) / 200;
        const durationBonus = Math.min(0.15, marriageDuration * 0.005);
        return Math.min(0.4, base * 0.2 + durationBonus);
    }
    calculateDomesticBonus(husbandPolitics, wifePolitics, marriageDuration) {
        const base = (husbandPolitics + wifePolitics) / 200;
        const durationBonus = Math.min(0.1, marriageDuration * 0.003);
        return Math.min(0.3, base * 0.15 + durationBonus);
    }
    calculateLoyaltyBonus(marriageDuration, hasChildren) {
        let bonus = marriageDuration * 0.5;
        if (hasChildren)
            bonus += 10;
        return Math.min(25, bonus);
    }
    getSpouseBonus(selfStats, spouseStats, marriageDuration, hasChildren) {
        return {
            combatSync: this.calculateCombatSync(selfStats.might, spouseStats.might, marriageDuration),
            domesticBonus: this.calculateDomesticBonus(selfStats.politics, spouseStats.politics, marriageDuration),
            loyaltyBonus: this.calculateLoyaltyBonus(marriageDuration, hasChildren),
            childBonus: hasChildren ? 0.1 : 0,
        };
    }
    calculateJointBattleDamage(baseDamage, combatSync) {
        return Math.round(baseDamage * (1 + combatSync));
    }
}
//# sourceMappingURL=spouse_synergy_system.js.map