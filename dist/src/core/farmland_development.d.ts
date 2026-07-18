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
    agricultureLevel: number;
    baseHarvest: number;
    hasDrought: boolean;
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
export declare class FarmlandDevelopment {
    private readonly MAX_AGRICULTURE;
    cultivate(city: CityAgriculture, officerPolitics: number, hasFarmingSkill: boolean): CultivationResult;
    calculateHarvest(city: CityAgriculture, agriLevel?: number): HarvestResult;
    applyDrought(city: CityAgriculture): void;
    recoverFromDrought(city: CityAgriculture): void;
}
//# sourceMappingURL=farmland_development.d.ts.map