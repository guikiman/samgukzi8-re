/**
 * [E1] 시장(상업) 개발 프로세스 — Market Development
 *
 * MarketDevelopment:
 *   1. 무장이 금 투자 + '상업' 임무 수행 시 도시 월 금 수입 비례 상승
 *   2. 투자 효율: 투자금 × (정치/100) × 보정계수
 *   3. 개발도 0~1000 범위, 월 수입 = 기본수입 × (1 + 개발도/500)
 */

export interface CityCommerce {
    readonly cityId: string;
    commerceLevel: number;       // 0~1000
    baseMonthlyIncome: number;   // 기본 월 금 수입
    governorPolitics: number;    // 태수 정치력
}

export interface InvestmentResult {
    readonly goldInvested: number;
    readonly commerceGain: number;
    readonly monthlyIncomeIncrease: number;
    readonly newCommerceLevel: number;
    readonly newMonthlyIncome: number;
}

export class MarketDevelopment {
    private readonly MAX_COMMERCE = 1000;
    private readonly EFFICIENCY_BASE = 0.5;

    invest(city: CityCommerce, goldAmount: number): InvestmentResult {
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

    calculateMonthlyIncome(city: CityCommerce, commerceLevel?: number): number {
        const level = commerceLevel ?? city.commerceLevel;
        return Math.floor(city.baseMonthlyIncome * (1 + level / 500));
    }
}
