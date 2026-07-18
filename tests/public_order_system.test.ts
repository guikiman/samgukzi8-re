import { describe, it, expect } from 'vitest';
import { PublicOrderSystem } from '../src/core/public_order_system';
import type { CityPublicOrder } from '../src/core/public_order_system';

describe('PublicOrderSystem', () => {
    const order = new PublicOrderSystem();

    function makeCity(level: number): CityPublicOrder {
        return { cityId: 'city_1', orderLevel: level, occupationPenalty: 0, recentPatrolBonus: 0 };
    }

    it('should calculate revolt risk inversely to order level', () => {
        const highRisk = order.getRevoltRisk(makeCity(20));
        const lowRisk = order.getRevoltRisk(makeCity(80));
        expect(highRisk).toBeGreaterThan(lowRisk);
    });

    it('should improve order on patrol', () => {
        const city = makeCity(50);
        const result = order.patrol(city, 80, false);
        expect(result.orderGain).toBeGreaterThan(0);
        expect(city.orderLevel).toBeGreaterThan(50);
    });

    it('should trigger revolt when risk is high', () => {
        const city = makeCity(10);
        let revoltCount = 0;
        const trials = 100;
        for (let i = 0; i < trials; i++) {
            const c = makeCity(10);
            const result = order.checkRevolt(c);
            if (result.revoltOccurred) revoltCount++;
        }
        // Risk = (100-10)/200 = 0.45, so roughly 45% chance
        expect(revoltCount).toBeGreaterThan(0);
    });

    it('should not trigger revolt when order is high', () => {
        const city = makeCity(95);
        const result = order.checkRevolt(city);
        expect(result.revoltOccurred).toBe(false);
    });

    it('should apply occupation penalty', () => {
        const city = makeCity(80);
        order.applyOccupationPenalty(city);
        expect(city.orderLevel).toBeLessThan(80);
        expect(city.occupationPenalty).toBeGreaterThan(0);
    });
});
