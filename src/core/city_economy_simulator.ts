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
    severity: number; // 0.0 ~ 1.0
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

export class CityEconomySimulator {
    inflationRate = 1.0;
    private loans: Map<FactionID, number> = new Map();
    private monopolyCities: Map<CityID, string> = new Map();
    corruptionRates: Map<CityID, number> = new Map();
    private disasterHistory: DisasterEvent[] = [];

    private static readonly SEASON_FOOD_MODIFIERS: Record<Season, number> = {
        SPRING: 0.8,
        SUMMER: 1.2,
        AUTUMN: 1.5,
        WINTER: 0.5,
    };

    private static readonly DISASTER_PROBABILITY: Record<Season, { type: DisasterEvent['type']; prob: number }[]> = {
        SPRING: [{ type: 'FLOOD', prob: 0.08 }, { type: 'PLAGUE', prob: 0.03 }],
        SUMMER: [{ type: 'DROUGHT', prob: 0.1 }, { type: 'LOCUST', prob: 0.05 }],
        AUTUMN: [{ type: 'LOCUST', prob: 0.06 }, { type: 'FLOOD', prob: 0.04 }],
        WINTER: [{ type: 'PLAGUE', prob: 0.07 }, { type: 'DROUGHT', prob: 0.03 }],
    };

    /**
     * 시장 가격 계산 (인플레이션 반영)
     */
    getMarketPrice(basePrice: number): number {
        return Math.floor(basePrice * this.inflationRate);
    }

    /**
     * 대상인 차용금
     */
    borrowMoney(warlordId: FactionID, amount: number): number {
        const repayAmount = Math.floor(amount * 1.2);
        this.loans.set(warlordId, (this.loans.get(warlordId) ?? 0) + repayAmount);
        return amount;
    }

    getDebt(warlordId: FactionID): number {
        return this.loans.get(warlordId) ?? 0;
    }

    repayLoan(warlordId: FactionID, amount: number): number {
        const current = this.loans.get(warlordId) ?? 0;
        const repay = Math.min(amount, current);
        this.loans.set(warlordId, current - repay);
        return repay;
    }

    /**
     * 화폐 주조 → 인플레이션 상승
     */
    mintMoney(amount: number): void {
        this.inflationRate += amount / 10000;
    }

    /**
     * 특산물 독점 설정
     */
    setMonopoly(cityId: CityID, resourceId: string): void {
        this.monopolyCities.set(cityId, resourceId);
    }

    getMonopoly(cityId: CityID): string | null {
        return this.monopolyCities.get(cityId) ?? null;
    }

    /**
     * 부패 감지
     */
    detectCorruption(cityId: CityID, inspectorPolitics: number): boolean {
        const rate = this.corruptionRates.get(cityId) ?? 0.1;
        return inspectorPolitics > rate * 100;
    }

    /**
     * 축제 개최 → 민심 상승
     */
    holdFestival(cityId: CityID, cost: number): number {
        return Math.floor(cost / 100);
    }

    /**
     * 징발(약탈적 세금) → 악명 증가, 금 확보
     */
    levyTax(cityId: CityID, population: number): number {
        return Math.floor(population * 0.05);
    }

    /**
     * 매월 도시 경제 처리
     */
    processMonthly(
        cityId: CityID,
        population: number,
        commerceLevel: number,
        farmingLevel: number,
        season: Season,
    ): MonthlyEconomyReport {
        const seasonMod = CityEconomySimulator.SEASON_FOOD_MODIFIERS[season];

        // 금 수입 = 상업 레벨 × 인구 보정
        const goldIncome = Math.floor(commerceLevel * 10 * (1 + population / 10000));

        // 식량 생산 = 농업 레벨 × 계절 보정 × 인구 보정
        const foodProduction = Math.floor(farmingLevel * 20 * seasonMod * (1 + population / 20000));

        // 식량 소비 = 인구
        const foodConsumption = population;

        // 인구 성장
        const populationGrowth = Math.max(1, Math.floor(population / 200));

        // 자연재해 발생 검사
        const disaster = this.rollDisaster(cityId, season);

        const adjustedFood = disaster?.type === 'DROUGHT' ? Math.floor(foodProduction * 0.3)
            : disaster?.type === 'FLOOD' ? Math.floor(foodProduction * 0.5)
            : disaster?.type === 'LOCUST' ? Math.floor(foodProduction * 0.2)
            : foodProduction;

        return {
            cityId,
            goldIncome,
            foodProduction: adjustedFood,
            foodConsumption,
            populationGrowth,
            disaster,
            inflationRate: this.inflationRate,
        };
    }

    private rollDisaster(cityId: CityID, season: Season): DisasterEvent | null {
        const candidates = CityEconomySimulator.DISASTER_PROBABILITY[season];
        for (const { type, prob } of candidates) {
            if (Math.random() < prob) {
                const severity = 0.3 + Math.random() * 0.7;
                const event: DisasterEvent = { type, severity, affectedCityId: cityId };
                this.disasterHistory.push(event);
                return event;
            }
        }
        return null;
    }

    getDisasterHistory(): DisasterEvent[] {
        return this.disasterHistory.slice();
    }

    reset(): void {
        this.inflationRate = 1.0;
        this.loans.clear();
        this.monopolyCities.clear();
        this.corruptionRates.clear();
        this.disasterHistory = [];
    }
}
