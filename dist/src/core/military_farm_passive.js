/**
 * [E6] 둔전지 운영 패시브 — Military Farm Passive
 *
 * MilitaryFarmPassive:
 *   1. 농업 수치 최고조 시 둔전 타일에 부대 배치 → 식량 소모 0
 *   2. 농작 수입 배가
 *   3. 둔전 운영 효율 = 무장 통솔력 × 특기 보정
 */
export class MilitaryFarmPassive {
    constructor() {
        this.MIN_AGRICULTURE = 700; // 둔전 활성화 최소 농업수치
        this.BASE_FOOD_PRODUCTION = 50;
    }
    canActivateFarm(city) {
        return city.agricultureLevel >= this.MIN_AGRICULTURE && !city.hasActiveFarm;
    }
    activateFarm(city, unitId, officerLeadership, hasFarmingSkill) {
        if (!this.canActivateFarm(city))
            return false;
        city.hasActiveFarm = true;
        city.garrisonUnitId = unitId;
        const skillBonus = hasFarmingSkill ? 0.5 : 0;
        const efficiency = (officerLeadership / 100 + skillBonus);
        city.foodProductionBonus = Math.floor(this.BASE_FOOD_PRODUCTION * efficiency);
        return true;
    }
    deactivateFarm(city) {
        city.hasActiveFarm = false;
        city.garrisonUnitId = null;
        city.foodProductionBonus = 0;
    }
    calculateMonthlyBenefit(city, baseFoodConsumption) {
        if (!city.hasActiveFarm || !city.garrisonUnitId) {
            return { foodSaved: 0, foodProduced: 0, totalFoodBenefit: 0, isActive: false };
        }
        const foodSaved = Math.floor(baseFoodConsumption * 0.5);
        const foodProduced = city.foodProductionBonus;
        return {
            foodSaved,
            foodProduced,
            totalFoodBenefit: foodSaved + foodProduced,
            isActive: true,
        };
    }
    processMonthlyDecay(city) {
        if (!city.hasActiveFarm)
            return;
        // 둔전 유지 패널티: 점진적 생산량 감소
        city.foodProductionBonus = Math.max(0, city.foodProductionBonus - 1);
        if (city.foodProductionBonus <= 0) {
            this.deactivateFarm(city);
        }
    }
}
//# sourceMappingURL=military_farm_passive.js.map