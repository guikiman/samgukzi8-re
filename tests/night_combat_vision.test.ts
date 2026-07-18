import { describe, it, expect } from 'vitest';
import { NightCombatVisionDiminisher } from '../src/core/night_combat_vision';

describe('NightCombatVisionDiminisher', () => {
    const night = new NightCombatVisionDiminisher();

    it('should reduce vision range at night (even turns)', () => {
        const mods = night.getNightModifiers(2);
        expect(mods.isNight).toBe(true);
        expect(mods.visionRangeReduction).toBe(2);
        expect(mods.ambushSuccessBonus).toBeGreaterThan(0);
        expect(mods.criticalDamageBonus).toBeGreaterThan(0);
    });

    it('should not apply modifiers during day (odd turns)', () => {
        const mods = night.getNightModifiers(1);
        expect(mods.isNight).toBe(false);
        expect(mods.visionRangeReduction).toBe(0);
        expect(mods.ambushSuccessBonus).toBe(0);
        expect(mods.criticalDamageBonus).toBe(0);
    });

    it('should reduce visible range at night', () => {
        const range = night.calculateVisibleRange(5, 2);
        expect(range).toBe(3);
    });

    it('should not reduce visible range below 1', () => {
        const range = night.calculateVisibleRange(2, 2);
        expect(range).toBe(1);
    });

    it('should increase ambush success at night', () => {
        const chance = night.calculateAmbushSuccess(0.5, 2);
        expect(chance).toBeGreaterThan(0.5);
    });

    it('should increase critical multiplier at night', () => {
        const mult = night.calculateCriticalMultiplier(1.5, 2);
        expect(mult).toBe(1.65);
    });
});
