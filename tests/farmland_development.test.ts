import { describe, it, expect } from 'vitest';
import { FarmlandDevelopment } from '../src/core/farmland_development';
import type { CityAgriculture } from '../src/core/farmland_development';

describe('FarmlandDevelopment', () => {
    const farm = new FarmlandDevelopment();

    function makeCity(agri: number, drought: boolean): CityAgriculture {
        return { cityId: 'city_1', agricultureLevel: agri, baseHarvest: 500, hasDrought: drought };
    }

    it('should increase agriculture on cultivation', () => {
        const city = makeCity(200, false);
        const result = farm.cultivate(city, 80, false);
        expect(result.agricultureGain).toBeGreaterThan(0);
        expect(city.agricultureLevel).toBeGreaterThan(200);
    });

    it('should give bonus with farming skill', () => {
        const city1 = makeCity(200, false);
        const city2 = makeCity(200, false);
        const r1 = farm.cultivate(city1, 80, true);
        const r2 = farm.cultivate(city2, 80, false);
        // Skill bonus should make r1 gains >= r2 gains on average
        expect(r1.agricultureGain).toBeGreaterThanOrEqual(r2.agricultureGain);
    });

    it('should calculate harvest correctly', () => {
        const city = makeCity(400, false);
        const harvest = farm.calculateHarvest(city);
        // 500 * (1 + 400/400) = 1000
        expect(harvest.totalHarvest).toBe(1000);
    });

    it('should apply drought penalty', () => {
        const city = makeCity(400, true);
        const harvest = farm.calculateHarvest(city);
        // 500 * (1 + 400/400) * 0.5 = 500
        expect(harvest.totalHarvest).toBe(500);
    });

    it('should reduce agriculture on drought', () => {
        const city = makeCity(500, false);
        farm.applyDrought(city);
        expect(city.hasDrought).toBe(true);
        expect(city.agricultureLevel).toBeLessThan(500);
    });
});
