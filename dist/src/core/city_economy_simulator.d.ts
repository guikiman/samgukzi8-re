/**
 * [7] 도시 경제 시뮬레이터 — City Economy Simulator
 *
 * 계절별 수확 시점의 세입(금, 군량)
 * 자연재해(가뭄, 홍수, 역병, 메뚜기 떼) 발생 매트릭스
 * 인플레이션/디플레이션 + 대상인 차용금 시스템
 */
import type { CityID, FactionID } from './types.js';
export type Season = 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER';
export interface DisasterEvent {
    type: 'DROUGHT' | 'FLOOD' | 'PLAGUE' | 'LOCUST';
    severity: number;
    affectedCityId: CityID;
}
export interface MonthlyEconomyReport {
    cityId: CityID;
    goldIncome: number;
    foodProduction: number;
    foodConsumption: number;
    populationGrowth: number;
    disaster: DisasterEvent | null;
    inflationRate: number;
}
export declare class CityEconomySimulator {
    inflationRate: number;
    private loans;
    private monopolyCities;
    corruptionRates: Map<CityID, number>;
    private disasterHistory;
    private static readonly SEASON_FOOD_MODIFIERS;
    private static readonly DISASTER_PROBABILITY;
    /**
     * 시장 가격 계산 (인플레이션 반영)
     */
    getMarketPrice(basePrice: number): number;
    /**
     * 대상인 차용금
     */
    borrowMoney(warlordId: FactionID, amount: number): number;
    getDebt(warlordId: FactionID): number;
    repayLoan(warlordId: FactionID, amount: number): number;
    /**
     * 화폐 주조 → 인플레이션 상승
     */
    mintMoney(amount: number): void;
    /**
     * 특산물 독점 설정
     */
    setMonopoly(cityId: CityID, resourceId: string): void;
    getMonopoly(cityId: CityID): string | null;
    /**
     * 부패 감지
     */
    detectCorruption(cityId: CityID, inspectorPolitics: number): boolean;
    /**
     * 축제 개최 → 민심 상승
     */
    holdFestival(cityId: CityID, cost: number): number;
    /**
     * 징발(약탈적 세금) → 악명 증가, 금 확보
     */
    levyTax(cityId: CityID, population: number): number;
    /**
     * 매월 도시 경제 처리
     */
    processMonthly(cityId: CityID, population: number, commerceLevel: number, farmingLevel: number, season: Season): MonthlyEconomyReport;
    private rollDisaster;
    getDisasterHistory(): DisasterEvent[];
    reset(): void;
}
//# sourceMappingURL=city_economy_simulator.d.ts.map