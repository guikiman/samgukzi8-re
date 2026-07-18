import { describe, it, expect } from 'vitest';
import { ArrowRainTrajectory } from '../src/core/arrow_rain_trajectory';

describe('ArrowRainTrajectory', () => {
    const trajectory = new ArrowRainTrajectory();

    it('should calculate arrow rain damage on targets in range', () => {
        const elevationMap = new Map<string, number>();
        elevationMap.set('0,0', 5);
        elevationMap.set('1,0', 3);
        elevationMap.set('0,1', 4);

        const result = trajectory.calculateArrowRain(
            'attacker_1', 0, 0, 5, 2, 80, elevationMap,
            [
                { q: 1, r: 0, unitId: 'target_1', defense: 20 },
                { q: 0, r: 1, unitId: 'target_2', defense: 30 },
            ],
        );

        expect(result.targets).toHaveLength(2);
        expect(result.totalDamage).toBeGreaterThan(0);
        expect(result.attackerId).toBe('attacker_1');
    });

    it('should not hit units outside range', () => {
        const elevationMap = new Map<string, number>();
        const result = trajectory.calculateArrowRain(
            'attacker_1', 0, 0, 5, 1, 80, elevationMap,
            [
                { q: 5, r: 5, unitId: 'far_unit', defense: 20 },
            ],
        );
        expect(result.targets).toHaveLength(0);
        expect(result.totalDamage).toBe(0);
    });

    it('should apply elevation bonus when attacker is higher', () => {
        const elevationMap = new Map<string, number>();
        elevationMap.set('1,0', 0);
        const result = trajectory.calculateArrowRain(
            'attacker_1', 0, 0, 10, 2, 80, elevationMap,
            [{ q: 1, r: 0, unitId: 'target', defense: 10 }],
        );
        expect(result.targets[0].finalDamage).toBeGreaterThan(result.targets[0].baseDamage);
    });
});
