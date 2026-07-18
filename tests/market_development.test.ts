import { describe, it, expect } from 'vitest';
import { MarketDevelopment } from '../src/core/market_development';
import type { CityCommerce } from '../src/core/market_development';

describe('MarketDevelopment', () => {
    const market = new MarketDevelopment();

    function makeCity(commerce: number, politics: number): CityCommerce {
        return {
            cityId: 'city_1',
            commerceLevel: commerce,
            baseMonthlyIncome: 100,
            governorPolitics: politics,
        };
    }

    it('should increase commerce level on investment', () => {
        const city = makeCity(100, 80);
        const result = market.invest(city, 500);
        expect(result.commerceGain).toBeGreaterThan(0);
        expect(result.newCommerceLevel).toBeGreaterThan(100);
        expect(city.commerceLevel).toBe(result.newCommerceLevel);
    });

    it('should not exceed max commerce level', () => {
        const city = makeCity(990, 100);
        const result = market.invest(city, 99999);
        expect(city.commerceLevel).toBeLessThanOrEqual(1000);
    });

    it('should calculate monthly income based on commerce level', () => {
        const city = makeCity(500, 80);
        const income = market.calculateMonthlyIncome(city);
        // 100 * (1 + 500/500) = 200
        expect(income).toBe(200);
    });

    it('should give higher gains with better politics', () => {
        const city1 = makeCity(100, 100);
        const city2 = makeCity(100, 20);
        const r1 = market.invest(city1, 500);
        const city2Copy = makeCity(100, 20);
        const r2 = market.invest(city2Copy, 500);
        expect(r1.commerceGain).toBeGreaterThanOrEqual(r2.commerceGain);
    });
});
