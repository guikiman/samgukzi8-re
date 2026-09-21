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
        // 단일 샘플은 랜덤 범위(5~10)가 겹쳐 플래키하므로 다중 샘플 평균으로 검증
        // 스킬 있음: 효율 1.1 → 평균 약 8.25 / 없음: 효율 0.8 → 평균 약 6.0
        const samples = 100;
        let sumWith = 0, sumWithout = 0;
        for (let i = 0; i < samples; i++) {
            sumWith += farm.cultivate(makeCity(200, false), 80, true).agricultureGain;
            sumWithout += farm.cultivate(makeCity(200, false), 80, false).agricultureGain;
        }
        expect(sumWith / samples).toBeGreaterThan(sumWithout / samples);
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
