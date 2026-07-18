import { describe, it, expect } from 'vitest';
import { HexNavalStateResolver } from '../src/core/hex_naval_state_resolver';
import type { BattleUnitState, HexTileState } from '../src/core/hex_naval_state_resolver';

describe('HexNavalStateResolver', () => {
    const resolver = new HexNavalStateResolver();

    function makeUnit(shipType: 'NONE' | 'MONGCHUNG' | 'NUSEON' | 'TUHAM'): BattleUnitState {
        return {
            id: 'unit_1',
            name: 'Test Unit',
            x: 0, y: 0, z: 0,
            stats: { command: 80, intelligence: 60, mobility: 5, defense: 100 },
            shipType,
            isNavalMode: false,
            currentMobility: 5,
            currentDefense: 100,
            conditions: [],
            morale: 100,
        };
    }

    function makeWaterTile(): HexTileState {
        return { x: 0, y: 0, z: 0, type: 'WATER' };
    }

    function makeLandTile(): HexTileState {
        return { x: 0, y: 0, z: 0, type: 'LAND' };
    }

    it('should set naval mode when entering water tile', () => {
        const unit = makeUnit('MONGCHUNG');
        resolver.resolveTileEntry(unit, makeWaterTile());
        expect(unit.isNavalMode).toBe(true);
    });

    it('should reduce defense for NONE ship type in water', () => {
        const unit = makeUnit('NONE');
        resolver.resolveTileEntry(unit, makeWaterTile());
        expect(unit.currentDefense).toBe(50);
    });

    it('should increase defense for TUHAM ship type in water', () => {
        const unit = makeUnit('TUHAM');
        resolver.resolveTileEntry(unit, makeWaterTile());
        expect(unit.currentDefense).toBeGreaterThanOrEqual(114);
    });

    it('should reset defense when leaving water', () => {
        const unit = makeUnit('NONE');
        unit.isNavalMode = true;
        unit.currentDefense = 50;
        resolver.resolveTileEntry(unit, makeLandTile());
        expect(unit.isNavalMode).toBe(false);
        expect(unit.currentDefense).toBe(100);
    });

    it('should return correct mobility costs', () => {
        expect(resolver.getMobilityCost('NONE')).toBe(99);
        expect(resolver.getMobilityCost('MONGCHUNG')).toBe(2);
        expect(resolver.getMobilityCost('NUSEON')).toBe(3);
        expect(resolver.getMobilityCost('TUHAM')).toBe(1);
    });

    it('should identify special ship abilities', () => {
        expect(resolver.hasRangedCounter('NUSEON')).toBe(true);
        expect(resolver.hasRangedCounter('NONE')).toBe(false);
        expect(resolver.hasCollisionBonus('TUHAM')).toBe(true);
        expect(resolver.hasCollisionBonus('NONE')).toBe(false);
        expect(resolver.hasFireVulnerability('NONE')).toBe(true);
        expect(resolver.hasFireVulnerability('MONGCHUNG')).toBe(false);
    });
});
