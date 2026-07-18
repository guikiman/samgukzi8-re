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
    commerceLevel: number;
    baseMonthlyIncome: number;
    governorPolitics: number;
}
export interface InvestmentResult {
    readonly goldInvested: number;
    readonly commerceGain: number;
    readonly monthlyIncomeIncrease: number;
    readonly newCommerceLevel: number;
    readonly newMonthlyIncome: number;
}
export declare class MarketDevelopment {
    private readonly MAX_COMMERCE;
    private readonly EFFICIENCY_BASE;
    invest(city: CityCommerce, goldAmount: number): InvestmentResult;
    calculateMonthlyIncome(city: CityCommerce, commerceLevel?: number): number;
}
//# sourceMappingURL=market_development.d.ts.map