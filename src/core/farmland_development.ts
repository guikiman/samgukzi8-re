/**
 * [E2] 농지(농업) 개척 모델 — Farmland Development
 *
 * FarmlandDevelopment:
 *   1. 농업 수치 증가 → 매년 가을(7월) 군량 수확량 극대화
 *   2. 개척 효율 = 무장 정치력 × (1 + 특기 보정)
 *   3. 수확량 = 기본수확 × (1 + 농업도/400)
 *   4. 가뭄 발생 시 수확량 50% 감소
 */

export interface CityAgriculture {
    readonly cityId: string;
    agricultureLevel: number;    // 0~1000
    baseHarvest: number;        // 기본 연간 수확량
    hasDrought: boolean;        // 가뭄 여부
}

export interface CultivationResult {
    readonly agricultureGain: number;
    readonly newAgricultureLevel: number;
    readonly expectedHarvest: number;
}

export interface HarvestResult {
    readonly totalHarvest: number;
    readonly baseHarvest: number;
    readonly droughtPenalty: number;
}

export class FarmlandDevelopment {
    private readonly MAX_AGRICULTURE = 1000;

    cultivate(
        city: CityAgriculture,
        officerPolitics: number,
        hasFarmingSkill: boolean,
    ): CultivationResult {
        const skillBonus = hasFarmingSkill ? 0.3 : 0;
        const efficiency = officerPolitics / 100 + skillBonus;
        const gain = Math.floor(efficiency * (5 + Math.random() * 5));
        const newLevel = Math.min(this.MAX_AGRICULTURE, city.agricultureLevel + gain);
        const actualGain = newLevel - city.agricultureLevel;

        city.agricultureLevel = newLevel;

        return {
            agricultureGain: actualGain,
            newAgricultureLevel: newLevel,
            expectedHarvest: this.calculateHarvest(city, newLevel).totalHarvest,
        };
    }

    calculateHarvest(city: CityAgriculture, agriLevel?: number): HarvestResult {
        const level = agriLevel ?? city.agricultureLevel;
        const baseHarvest = Math.floor(city.baseHarvest * (1 + level / 400));
        const droughtPenalty = city.hasDrought ? 0.5 : 0;
        const totalHarvest = Math.floor(baseHarvest * (1 - droughtPenalty));

        return { totalHarvest, baseHarvest, droughtPenalty: Math.floor(baseHarvest * droughtPenalty) };
    }

    applyDrought(city: CityAgriculture): void {
        city.hasDrought = true;
        city.agricultureLevel = Math.max(0, city.agricultureLevel - Math.floor(city.agricultureLevel * 0.1));
    }

    recoverFromDrought(city: CityAgriculture): void {
        city.hasDrought = false;
    }
}
