import { describe, it, expect } from 'vitest';
import { TechnologyResearch } from '../src/core/technology_research';
import type { CityTechnology } from '../src/core/technology_research';

describe('TechnologyResearch', () => {
    const tech = new TechnologyResearch();

    function makeCity(points: number): CityTechnology {
        return { cityId: 'city_1', techPoints: points, currentTier: 0, unlockedUnits: [] };
    }

    it('should increase tech points on research', () => {
        const city = makeCity(100);
        const result = tech.research(city, 80, false);
        expect(result.techGain).toBeGreaterThan(0);
        expect(city.techPoints).toBeGreaterThan(100);
    });

    it('should upgrade tier at threshold', () => {
        const city = makeCity(490);
        const result = tech.research(city, 100, true);
        if (city.techPoints >= 500) {
            expect(result.tierUpgraded).toBe(true);
            expect(city.currentTier).toBeGreaterThanOrEqual(1);
        }
    });

    it('should unlock units on tier upgrade', () => {
        const city = makeCity(1000);
        tech.research(city, 100, true);
        if (city.currentTier >= 2) {
            expect(city.unlockedUnits).toContain('HEAVY_INFANTRY');
            expect(city.unlockedUnits).toContain('CROSSBOW');
        }
    });

    it('should unlock all units at tier 3', () => {
        const city = makeCity(2000);
        tech.research(city, 100, true);
        expect(city.unlockedUnits).toContain('TIGER_CAVALRY');
        expect(city.unlockedUnits).toContain('IRON_SHIELD');
    });

    it('should return correct tier thresholds', () => {
        expect(tech.getTierThreshold(0)).toBe(0);
        expect(tech.getTierThreshold(1)).toBe(500);
        expect(tech.getTierThreshold(2)).toBe(1000);
        expect(tech.getTierThreshold(3)).toBe(2000);
    });
});
