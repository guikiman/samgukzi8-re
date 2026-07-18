/**
 * [E1] 시장(상업) 개발 프로세스 — Market Development
 *
 * MarketDevelopment:
 *   1. 무장이 금 투자 + '상업' 임무 수행 시 도시 월 금 수입 비례 상승
 *   2. 투자 효율: 투자금 × (정치/100) × 보정계수
 *   3. 개발도 0~1000 범위, 월 수입 = 기본수입 × (1 + 개발도/500)
 */
export class MarketDevelopment {
    constructor() {
        this.MAX_COMMERCE = 1000;
        this.EFFICIENCY_BASE = 0.5;
    }
    invest(city, goldAmount) {
        const efficiency = this.EFFICIENCY_BASE + (city.governorPolitics / 200);
        const commerceGain = Math.floor(goldAmount * efficiency * (1 + Math.random() * 0.1));
        const newLevel = Math.min(this.MAX_COMMERCE, city.commerceLevel + commerceGain);
        const actualGain = newLevel - city.commerceLevel;
        city.commerceLevel = newLevel;
        const oldIncome = this.calculateMonthlyIncome(city, city.commerceLevel - actualGain);
        const newIncome = this.calculateMonthlyIncome(city, newLevel);
        return {
            goldInvested: goldAmount,
            commerceGain: actualGain,
            monthlyIncomeIncrease: newIncome - oldIncome,
            newCommerceLevel: newLevel,
            newMonthlyIncome: newIncome,
        };
    }
    calculateMonthlyIncome(city, commerceLevel) {
        const level = commerceLevel ?? city.commerceLevel;
        return Math.floor(city.baseMonthlyIncome * (1 + level / 500));
    }
}
//# sourceMappingURL=market_development.js.map