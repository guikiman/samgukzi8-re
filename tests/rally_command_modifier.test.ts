import { describe, it, expect } from 'vitest';
import { RallyCommandModifier } from '../src/core/rally_command_modifier';

describe('RallyCommandModifier', () => {
    const rally = new RallyCommandModifier();

    it('should affect units within range', () => {
        const aura = rally.calculateAura('ruler_1', 95, [
            { unitId: 'unit_1', confused: true, panicked: false, poisoned: false, defense: 50, distance: 1 },
            { unitId: 'unit_2', confused: false, panicked: true, poisoned: false, defense: 40, distance: 4 },
        ]);
        expect(aura.affectedUnits).toContain('unit_1');
        expect(aura.affectedUnits).not.toContain('unit_2');
        expect(aura.defenseBonus).toBeGreaterThan(0);
    });

    it('should apply defense bonus to affected units', () => {
        const aura = rally.calculateAura('ruler_1', 95, [
            { unitId: 'unit_1', confused: false, panicked: false, poisoned: false, defense: 50, distance: 1 },
        ]);
        const effects = rally.applyAuraEffects(
            { unitId: 'unit_1', confused: false, panicked: false, poisoned: false, defense: 50, distance: 1 },
            aura,
        );
        expect(effects.defense).toBeGreaterThan(50);
    });

    it('should not affect units outside range', () => {
        const aura = rally.calculateAura('ruler_1', 95, [
            { unitId: 'unit_far', confused: true, panicked: false, poisoned: false, defense: 50, distance: 5 },
        ]);
        expect(aura.affectedUnits).not.toContain('unit_far');
    });
});
