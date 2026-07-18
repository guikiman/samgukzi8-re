/**
 * [E6] 둔전지 운영 패시브 — Military Farm Passive
 *
 * MilitaryFarmPassive:
 *   1. 농업 수치 최고조 시 둔전 타일에 부대 배치 → 식량 소모 0
 *   2. 농작 수입 배가
 *   3. 둔전 운영 효율 = 무장 통솔력 × 특기 보정
 */
export interface MilitaryFarm {
    readonly cityId: string;
    readonly agricultureLevel: number;
    hasActiveFarm: boolean;
    garrisonUnitId: string | null;
    foodProductionBonus: number;
}
export interface FarmOperationResult {
    readonly foodSaved: number;
    readonly foodProduced: number;
    readonly totalFoodBenefit: number;
    readonly isActive: boolean;
}
export declare class MilitaryFarmPassive {
    private readonly MIN_AGRICULTURE;
    private readonly BASE_FOOD_PRODUCTION;
    canActivateFarm(city: MilitaryFarm): boolean;
    activateFarm(city: MilitaryFarm, unitId: string, officerLeadership: number, hasFarmingSkill: boolean): boolean;
    deactivateFarm(city: MilitaryFarm): void;
    calculateMonthlyBenefit(city: MilitaryFarm, baseFoodConsumption: number): FarmOperationResult;
    processMonthlyDecay(city: MilitaryFarm): void;
}
//# sourceMappingURL=military_farm_passive.d.ts.map