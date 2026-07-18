import { describe, it, expect } from 'vitest';
import { FogOfWarLOSPathfinder } from '../src/core/fog_of_war_los_pathfinder';
import type { BattleUnitState, HexTileState } from '../src/core/hex_naval_state_resolver';

describe('FogOfWarLOSPathfinder', () => {
    const los = new FogOfWarLOSPathfinder();

    function makeUnit(id: string, x: number, y: number, z: number, cmd: number, int_: number): BattleUnitState {
        return {
            id,
            name: `Unit ${id}`,
            x, y, z,
            stats: { command: cmd, intelligence: int_, mobility: 5, defense: 100 },
            shipType: 'NONE',
            isNavalMode: false,
            currentMobility: 5,
            currentDefense: 100,
            conditions: [],
            morale: 100,
        };
    }

    function makeTile(x: number, y: number, z: number, type: 'LAND' | 'FOREST' | 'MOUNTAIN' | 'WATER'): HexTileState {
        return { x, y, z, type };
    }

    it('should calculate visible tiles within LOS range', () => {
        const units = new Map<string, BattleUnitState>();
        units.set('ally_1', makeUnit('ally_1', 0, 0, 0, 80, 60));

        const grid = new Map<string, HexTileState>();
        for (let q = -5; q <= 5; q++) {
            for (let r = -5; r <= 5; r++) {
                const s = -q - r;
                grid.set(`${q},${r},${s}`, makeTile(q, r, s, 'LAND'));
            }
        }

        const result = los.calculateVisibleTiles(units, grid, ['ally_1'], 'SUNNY', []);
        // LOS = 3 + floor(80/40) + floor(60/50) = 3 + 2 + 1 = 6
        expect(result.visibleTiles.size).toBeGreaterThan(0);
    });

    it('should reduce LOS to 1 in FOG weather', () => {
        const units = new Map<string, BattleUnitState>();
        units.set('ally_1', makeUnit('ally_1', 0, 0, 0, 100, 100));

        const grid = new Map<string, HexTileState>();
        for (let q = -5; q <= 5; q++) {
            for (let r = -5; r <= 5; r++) {
                const s = -q - r;
                grid.set(`${q},${r},${s}`, makeTile(q, r, s, 'LAND'));
            }
        }

        const result = los.calculateVisibleTiles(units, grid, ['ally_1'], 'FOG', []);
        // LOS = 1 in FOG
        // Only center tile (0,0,0) + 6 neighbors = 7 tiles visible
        expect(result.visibleTiles.size).toBeLessThanOrEqual(7);
    });

    it('should detect visible enemy units', () => {
        const units = new Map<string, BattleUnitState>();
        units.set('ally_1', makeUnit('ally_1', 0, 0, 0, 80, 60));

        const grid = new Map<string, HexTileState>();
        for (let q = -5; q <= 5; q++) {
            for (let r = -5; r <= 5; r++) {
                const s = -q - r;
                grid.set(`${q},${r},${s}`, makeTile(q, r, s, 'LAND'));
            }
        }

        const enemyUnits = [
            makeUnit('enemy_1', 1, 0, -1, 80, 60),  // within range
            makeUnit('enemy_2', 10, 0, -10, 80, 60), // far away
        ];

        const result = los.calculateVisibleTiles(units, grid, ['ally_1'], 'SUNNY', enemyUnits);
        expect(result.visibleEnemyUnitIds).toContain('enemy_1');
        expect(result.hiddenEnemyUnitIds).toContain('enemy_2');
    });

    it('should hide enemies in forest tiles unless adjacent', () => {
        const units = new Map<string, BattleUnitState>();
        units.set('ally_1', makeUnit('ally_1', 0, 0, 0, 80, 60));

        const grid = new Map<string, HexTileState>();
        grid.set('2,0,-2', makeTile(2, 0, -2, 'FOREST'));
        for (let q = -5; q <= 5; q++) {
            for (let r = -5; r <= 5; r++) {
                const s = -q - r;
                if (!grid.has(`${q},${r},${s}`)) {
                    grid.set(`${q},${r},${s}`, makeTile(q, r, s, 'LAND'));
                }
            }
        }

        const enemyUnits = [
            makeUnit('enemy_hidden', 2, 0, -2, 80, 60), // in forest, not adjacent
        ];

        const result = los.calculateVisibleTiles(units, grid, ['ally_1'], 'SUNNY', enemyUnits);
        expect(result.hiddenEnemyUnitIds).toContain('enemy_hidden');
    });
});
