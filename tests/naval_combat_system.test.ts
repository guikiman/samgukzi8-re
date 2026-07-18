import { describe, it, expect } from 'vitest';
import { NavalCombatSystem } from '../src/core/naval_combat_system';

describe('NavalCombatSystem', () => {
    const naval = new NavalCombatSystem();
    const stats = { leadership: 80, might: 70, intelligence: 60, politics: 50, charisma: 65 };

    it('should return ship stats', () => {
        const ship = naval.getShipStats('LOUSCHUAN');
        expect(ship.attack).toBe(40);
        expect(ship.defense).toBe(9);
    });

    it('should return all ship types', () => {
        expect(naval.getAllShipTypes().length).toBe(5);
    });

    it('should calculate counter bonus', () => {
        expect(naval.getShipCounter('LOUSCHUAN', 'MENGCHONG')).toBe(1.5);
        expect(naval.getShipCounter('MENGCHONG', 'LOUSCHUAN')).toBe(0.7);
    });

    it('should return 1.0 for non-counter matchups', () => {
        expect(naval.getShipCounter('WARSHIP', 'TRANSPORT')).toBe(1.0);
    });

    it('should calculate naval damage', () => {
        const damage = naval.calculateNavalDamage('WARSHIP', 'TRANSPORT', stats, stats, 'SUNNY');
        expect(damage).toBeGreaterThanOrEqual(1);
    });

    it('should apply weather penalty to damage', () => {
        const sunny = naval.calculateNavalDamage('WARSHIP', 'TRANSPORT', stats, stats, 'SUNNY');
        const storm = naval.calculateNavalDamage('WARSHIP', 'TRANSPORT', stats, stats, 'STORM');
        expect(storm).toBeLessThanOrEqual(sunny);
    });

    it('should calculate terrain penalty', () => {
        const river = naval.getTerrainPenalty('LOUSCHUAN', 'RIVER');
        const sea = naval.getTerrainPenalty('LOUSCHUAN', 'SEA');
        expect(river).toBeGreaterThan(sea);
    });

    it('should calculate movement cost', () => {
        const cost = naval.getMovementCost('PATROL', 'SEA', 'SUNNY');
        expect(cost).toBeGreaterThanOrEqual(0.5);
    });

    it('should calculate vision range', () => {
        const vision = naval.getVisionRange('PATROL', 'SUNNY');
        expect(vision).toBeGreaterThanOrEqual(1);
    });
});
