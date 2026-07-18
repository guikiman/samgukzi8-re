import { describe, it, expect } from 'vitest';
import { NavalDriftEngine } from '../src/core/naval_drift_engine';
import type { BattleUnitState, HexTileState } from '../src/core/hex_naval_state_resolver';

describe('NavalDriftEngine', () => {
    const engine = new NavalDriftEngine();

    function makeNavalUnit(id: string, x: number, y: number, z: number): BattleUnitState {
        return {
            id,
            name: `Unit ${id}`,
            x, y, z,
            stats: { command: 80, intelligence: 60, mobility: 5, defense: 100 },
            shipType: 'MONGCHUNG',
            isNavalMode: true,
            currentMobility: 5,
            currentDefense: 100,
            conditions: [],
            morale: 100,
        };
    }

    function makeWaterTile(x: number, y: number, z: number, dx?: number, dy?: number, dz?: number): HexTileState {
        return { x, y, z, type: 'WATER', driftVector: dx !== undefined ? { dx, dy: dy!, dz: dz! } : undefined };
    }

    it('should drift unit along driftVector', () => {
        const units = new Map<string, BattleUnitState>();
        const unit = makeNavalUnit('unit_1', 0, 0, 0);
        units.set('unit_1', unit);

        const grid = new Map<string, HexTileState>();
        grid.set('0,0,0', makeWaterTile(0, 0, 0, 1, -1, 0));
        grid.set('1,-1,0', makeWaterTile(1, -1, 0, 0, 0, 0));

        const results = engine.processTurnEndDrift(units, grid);
        expect(unit.x).toBe(1);
        expect(unit.y).toBe(-1);
        expect(results[0].collision).toBe(false);
    });

    it('should apply collision when drifting into land', () => {
        const units = new Map<string, BattleUnitState>();
        const unit = makeNavalUnit('unit_1', 0, 0, 0);
        units.set('unit_1', unit);

        const grid = new Map<string, HexTileState>();
        grid.set('0,0,0', makeWaterTile(0, 0, 0, 1, -1, 0));
        grid.set('1,-1,0', { x: 1, y: -1, z: 0, type: 'LAND' });

        const results = engine.processTurnEndDrift(units, grid);
        expect(results[0].collision).toBe(true);
        expect(unit.morale).toBeLessThan(100);
    });

    it('should not drift non-naval units', () => {
        const units = new Map<string, BattleUnitState>();
        const unit = makeNavalUnit('unit_1', 0, 0, 0);
        unit.isNavalMode = false;
        units.set('unit_1', unit);

        const grid = new Map<string, HexTileState>();
        grid.set('0,0,0', makeWaterTile(0, 0, 0, 1, -1, 0));

        const results = engine.processTurnEndDrift(units, grid);
        expect(results).toHaveLength(0);
    });
});
