import { describe, it, expect, beforeEach } from 'vitest';
import { StatModifierCalculator } from '../src/core/stat_modifier_calculator';

describe('StatModifierCalculator', () => {
    let calc: StatModifierCalculator;

    beforeEach(() => {
        calc = new StatModifierCalculator();
    });

    const baseStats = { leadership: 80, might: 70, intelligence: 60, politics: 50, charisma: 90 };

    it('should return base stats when no modifiers', () => {
        const effective = calc.getEffectiveStats('officer_1', baseStats);
        expect(effective).toEqual(baseStats);
    });

    it('should apply a single modifier', () => {
        calc.addModifier('officer_1', {
            id: 'mod1', officerId: 'officer_1', type: 'ITEM_WEAPON', source: 'ITEM',
            statKey: 'might', value: 15, duration: 5, turnsRemaining: 5,
            sourceId: 'weapon_1', label: '청룡언월도', appliedTurn: 1,
        });
        const effective = calc.getEffectiveStats('officer_1', baseStats);
        expect(effective.might).toBe(85);
    });

    it('should apply multiple modifiers stacking', () => {
        calc.addModifier('officer_1', {
            id: 'mod1', officerId: 'officer_1', type: 'ITEM_WEAPON', source: 'ITEM',
            statKey: 'might', value: 15, duration: 5, turnsRemaining: 5,
            sourceId: 'weapon_1', label: '청룡언월도', appliedTurn: 1,
        });
        calc.addModifier('officer_1', {
            statKey: 'might', value: -10, duration: 3, turnsRemaining: 3,
            sourceId: 'illness', label: '전염병', appliedTurn: 1,
        });
        const effective = calc.getEffectiveStats('officer_1', baseStats);
        expect(effective.might).toBe(75); // 70 + 15 - 10
    });

    it('should clamp stats to [0, 200]', () => {
        calc.addModifier('officer_1', {
            statKey: 'leadership', value: 200, duration: 5, turnsRemaining: 5,
            sourceId: 'buff_1', label: '신비의힘', appliedTurn: 1,
        });
        const effective = calc.getEffectiveStats('officer_1', baseStats);
        expect(effective.leadership).toBe(200);
    });

    it('should remove modifier by sourceId', () => {
        calc.addModifier('officer_1', {
            statKey: 'might', value: 15, duration: 5, turnsRemaining: 5,
            sourceId: 'weapon_1', label: '검', appliedTurn: 1,
        });
        expect(calc.removeModifier('officer_1', 'weapon_1')).toBe(true);
        const effective = calc.getEffectiveStats('officer_1', baseStats);
        expect(effective.might).toBe(70);
    });

    it('should tick and expire modifiers', () => {
        calc.addModifier('officer_1', {
            statKey: 'intelligence', value: 10, duration: 2, turnsRemaining: 2,
            sourceId: 'buff_1', label: '지혜', appliedTurn: 1,
        });
        calc.tickAll();
        let active = calc.getActiveModifiers('officer_1');
        expect(active.length).toBe(1);
        calc.tickAll();
        active = calc.getActiveModifiers('officer_1');
        expect(active.length).toBe(0);
    });

    it('should clear all modifiers for an officer', () => {
        calc.addModifier('officer_1', {
            statKey: 'might', value: 10, duration: 5, turnsRemaining: 5,
            sourceId: 'buff_1', label: '파워', appliedTurn: 1,
        });
        calc.clearOfficer('officer_1');
        expect(calc.getActiveModifiers('officer_1').length).toBe(0);
    });

    it('should handle different officers independently', () => {
        calc.addModifier('officer_1', {
            id: 'mod1', officerId: 'officer_1', type: 'BUFF', source: 'BUFF',
            statKey: 'might', value: 10, duration: 5, turnsRemaining: 5,
            sourceId: 'buff_1', label: '', appliedTurn: 1,
        });
        calc.addModifier('officer_2', {
            statKey: 'leadership', value: -5, duration: 5, turnsRemaining: 5,
            sourceId: 'debuff_1', label: '', appliedTurn: 1,
        });
        const off1 = calc.getEffectiveStats('officer_1', baseStats);
        const off2 = calc.getEffectiveStats('officer_2', baseStats);
        expect(off1.might).toBe(80);
        expect(off2.leadership).toBe(75);
    });
});
