import { describe, it, expect } from 'vitest';
import { StratagemHealAura } from '../src/core/stratagem_heal_aura';

describe('StratagemHealAura', () => {
    const aura = new StratagemHealAura();

    it('should heal nearby wounded units', () => {
        const effect = aura.activateHealAura('caster_1', 90, ['MEDICINE'], [
            { unitId: 'unit_1', woundedSoldiers: 100, fatigue: 50, distance: 1 },
            { unitId: 'unit_2', woundedSoldiers: 50, fatigue: 30, distance: 2 },
        ]);
        expect(effect.affectedUnits).toHaveLength(2);
        expect(effect.healAmount).toBeGreaterThan(0);
        expect(effect.range).toBe(3);
    });

    it('should not heal units beyond range', () => {
        const aura = new StratagemHealAura();
        const effect = aura.activateHealAura('caster_1', 90, ['MEDICINE'], [
            { unitId: 'unit_far', woundedSoldiers: 100, fatigue: 50, distance: 5 },
        ]);
        expect(effect.affectedUnits).toHaveLength(0);
        expect(effect.healAmount).toBe(0);
    });

    it('should heal more with MEDICINE skill', () => {
        const aura1 = new StratagemHealAura();
        const aura2 = new StratagemHealAura();
        const effect1 = aura1.activateHealAura('caster_1', 90, ['MEDICINE'], [
            { unitId: 'unit_1', woundedSoldiers: 100, fatigue: 50, distance: 1 },
        ]);
        const effect2 = aura2.activateHealAura('caster_2', 90, [], [
            { unitId: 'unit_1', woundedSoldiers: 100, fatigue: 50, distance: 1 },
        ]);
        expect(effect1.healAmount).toBeGreaterThanOrEqual(effect2.healAmount);
    });

    it('should track total healed', () => {
        const aura = new StratagemHealAura();
        aura.activateHealAura('caster_1', 90, ['MEDICINE'], [
            { unitId: 'unit_1', woundedSoldiers: 100, fatigue: 50, distance: 1 },
        ]);
        expect(aura.getTotalHealed()).toBeGreaterThan(0);
    });
});
