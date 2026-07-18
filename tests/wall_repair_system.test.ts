import { describe, it, expect } from 'vitest';
import { WallRepairSystem } from '../src/core/wall_repair_system';
import type { CityWall } from '../src/core/wall_repair_system';

describe('WallRepairSystem', () => {
    const wallSys = new WallRepairSystem();

    function makeWall(cur: number, max: number): CityWall {
        return { cityId: 'city_1', maxDurability: max, currentDurability: cur, defenseAbsorption: 0.3 };
    }

    it('should repair wall durability', () => {
        const wall = makeWall(50, 100);
        const result = wallSys.repair(wall, 80, false, 100);
        expect(result.repairAmount).toBeGreaterThan(0);
        expect(wall.currentDurability).toBeGreaterThan(50);
    });

    it('should fully repair when budget sufficient', () => {
        const wall = makeWall(95, 100);
        const result = wallSys.repair(wall, 100, true, 100);
        expect(result.isFullyRepaired).toBe(true);
        expect(wall.currentDurability).toBe(100);
    });

    it('should absorb siege damage based on durability', () => {
        const wall = makeWall(100, 100);
        const result = wallSys.applySiegeDamage(wall, 100);
        expect(result.absorbedDamage).toBeGreaterThan(0);
        expect(result.finalDamage).toBeLessThan(100);
    });

    it('should breach wall when durability reaches 0', () => {
        const wall = makeWall(10, 100);
        const result = wallSys.applySiegeDamage(wall, 999);
        expect(result.wallBreached).toBe(true);
        expect(result.remainingDurability).toBe(0);
    });

    it('should upgrade wall stats', () => {
        const wall = makeWall(100, 100);
        wallSys.upgradeWall(wall, 500);
        expect(wall.maxDurability).toBeGreaterThan(100);
        expect(wall.currentDurability).toBeGreaterThan(100);
        expect(wall.defenseAbsorption).toBeGreaterThan(0.3);
    });
});
