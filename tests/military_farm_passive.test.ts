import { describe, it, expect } from 'vitest';
import { MilitaryFarmPassive } from '../src/core/military_farm_passive';
import type { MilitaryFarm } from '../src/core/military_farm_passive';

describe('MilitaryFarmPassive', () => {
    const farm = new MilitaryFarmPassive();

    function makeFarm(agri: number, active: boolean): MilitaryFarm {
        return {
            cityId: 'city_1',
            agricultureLevel: agri,
            hasActiveFarm: active,
            garrisonUnitId: active ? 'unit_1' : null,
            foodProductionBonus: active ? 50 : 0,
        };
    }

    it('should activate when agriculture level is high enough', () => {
        const city = makeFarm(800, false);
        expect(farm.canActivateFarm(city)).toBe(true);
    });

    it('should not activate when agriculture level is low', () => {
        const city = makeFarm(300, false);
        expect(farm.canActivateFarm(city)).toBe(false);
    });

    it('should activate farm successfully', () => {
        const city = makeFarm(800, false);
        const result = farm.activateFarm(city, 'unit_1', 80, false);
        expect(result).toBe(true);
        expect(city.hasActiveFarm).toBe(true);
        expect(city.garrisonUnitId).toBe('unit_1');
    });

    it('should save food when active', () => {
        const city = makeFarm(800, true);
        const benefit = farm.calculateMonthlyBenefit(city, 200);
        expect(benefit.isActive).toBe(true);
        expect(benefit.foodSaved).toBeGreaterThan(0);
        expect(benefit.totalFoodBenefit).toBeGreaterThan(0);
    });

    it('should return zero benefit when inactive', () => {
        const city = makeFarm(500, false);
        const benefit = farm.calculateMonthlyBenefit(city, 200);
        expect(benefit.isActive).toBe(false);
        expect(benefit.totalFoodBenefit).toBe(0);
    });

    it('should deactivate after decay', () => {
        const city = makeFarm(800, true);
        city.foodProductionBonus = 1;
        farm.processMonthlyDecay(city);
        expect(city.hasActiveFarm).toBe(false);
        expect(city.garrisonUnitId).toBeNull();
    });
});
