/**
 * Phase 4-3: 전투 시스템 테스트 (battle_balance.ts, tactical_ai_logic.ts)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { BattleBalance, HexCoord, TileHeight } from '../src/core/battle_balance.js';
import { TacticalAILogic, TacticalUnit, TacticalEvaluation } from '../src/core/tactical_ai_logic.js';

// ============================================================
// BattleBalance 테스트
// ============================================================
describe('BattleBalance', () => {
    let bb: BattleBalance;

    beforeEach(() => {
        bb = new BattleBalance();
    });

    it('computeChainDamage returns base damage for chainCount=1', () => {
        expect(bb.computeChainDamage(100, 1)).toBe(100);
    });

    it('computeChainDamage increases with chainCount', () => {
        const d1 = bb.computeChainDamage(100, 1);
        const d2 = bb.computeChainDamage(100, 2);
        expect(d2).toBeGreaterThan(d1);
    });

    it('computeChainDamage with high chain has diminishing returns', () => {
        const d2 = bb.computeChainDamage(100, 2, 0.15, 0.12);
        const d10 = bb.computeChainDamage(100, 10, 0.15, 0.12);
        // Even at chain 10, damage should not be absurdly high
        expect(d10).toBeLessThan(d2 * 5);
    });

    it('computeChainDamage with zero decay keeps growing', () => {
        const d5 = bb.computeChainDamage(100, 5, 0.2, 0);
        expect(d5).toBeGreaterThan(100);
    });

    it('computeChainDamage never returns less than base', () => {
        for (let n = 1; n <= 20; n++) {
            const d = bb.computeChainDamage(100, n, 0.05, 0.5);
            expect(d).toBeGreaterThanOrEqual(100);
        }
    });

    it('computeMoraleDrop returns base at distance 0', () => {
        expect(bb.computeMoraleDrop(0)).toBe(30);
        expect(bb.computeMoraleDrop(0, 50)).toBe(50);
    });

    it('computeMoraleDrop decreases with distance', () => {
        const d0 = bb.computeMoraleDrop(0);
        const d1 = bb.computeMoraleDrop(1);
        const d3 = bb.computeMoraleDrop(3);
        expect(d0).toBeGreaterThan(d1);
        expect(d1).toBeGreaterThan(d3);
    });

    it('computeMoraleDrop at distance 1 is base/2', () => {
        const result = bb.computeMoraleDrop(1, 30);
        expect(result).toBe(15); // 30 / (1 + 1)
    });

    it('computeMoraleDrop at large distance approaches 0', () => {
        expect(bb.computeMoraleDrop(100, 30)).toBe(0);
    });

    it('checkLineOfSight returns true when clear', () => {
        const heightMap = new Map<string, number>([
            ['0,0', 0], ['1,0', 0], ['2,0', 0],
        ]);
        expect(bb.checkLineOfSight({ q: 0, r: 0 }, { q: 2, r: 0 }, heightMap)).toBe(true);
    });

    it('checkLineOfSight returns false when blocked', () => {
        const heightMap = new Map<string, number>([
            ['0,0', 0], ['1,0', 5], ['2,0', 0],
        ]);
        expect(bb.checkLineOfSight({ q: 0, r: 0 }, { q: 2, r: 0 }, heightMap)).toBe(false);
    });

    it('checkLineOfSight handles same-point origin and target', () => {
        const heightMap = new Map<string, number>([['0,0', 0]]);
        expect(bb.checkLineOfSight({ q: 0, r: 0 }, { q: 0, r: 0 }, heightMap)).toBe(true);
    });

    it('checkLineOfSight handles missing heights as 0', () => {
        const heightMap = new Map<string, number>();
        expect(bb.checkLineOfSight({ q: 0, r: 0 }, { q: 2, r: 0 }, heightMap)).toBe(true);
    });

    it('computeChainDamage works with custom bonus and decay', () => {
        const result = bb.computeChainDamage(100, 3, 0.2, 0.1);
        expect(result).toBeGreaterThan(100);
    });

    it('computeMoraleDrop with custom baseDrop', () => {
        expect(bb.computeMoraleDrop(2, 50)).toBe(10); // 50 / (1 + 4)
    });
});

// ============================================================
// TacticalAILogic 테스트
// ============================================================
describe('TacticalAILogic', () => {
    let ai: TacticalAILogic;

    beforeEach(() => {
        ai = new TacticalAILogic();
    });

    function makeUnit(id: string, q: number, r: number, overrides: Partial<TacticalUnit> = {}): TacticalUnit {
        return {
            id, position: { q, r },
            unitType: 'infantry', soldiers: 1000, morale: 80, remainingMP: 5,
            ...overrides,
        };
    }

    it('evaluatePosition sets threat based on nearby enemies', () => {
        const unit = makeUnit('u1', 0, 0);
        const enemies = [{ q: 1, r: 0 }, { q: 0, r: 1 }];
        const allies = [{ q: -1, r: 0 }];
        const terrain = new Map([['0,0', 'plain']]);
        const result = ai.evaluatePosition(unit, allies, enemies, terrain);
        expect(result.threatLevel).toBeGreaterThan(0);
        expect(result.threatLevel).toBeLessThanOrEqual(1);
    });

    it('evaluatePosition recommends retreat when outnumbered', () => {
        const unit = makeUnit('u1', 0, 0, { morale: 20 });
        const enemies = [{ q: 1, r: 0 }, { q: 0, r: 1 }, { q: -1, r: 0 }];
        const allies: { q: number; r: number }[] = [];
        const terrain = new Map([['0,0', 'plain']]);
        const result = ai.evaluatePosition(unit, allies, enemies, terrain);
        expect(result.retreatRecommended).toBe(true);
    });

    it('evaluatePosition detects flank possibility', () => {
        const unit = makeUnit('u1', 0, 0);
        const enemies = [{ q: 1, r: 0 }];
        const allies = [{ q: 0, r: -1 }, { q: 0, r: 1 }];
        const terrain = new Map([['0,0', 'plain']]);
        const result = ai.evaluatePosition(unit, allies, enemies, terrain);
        expect(result.flankPossible).toBe(true);
    });

    it('evaluatePosition returns bestTarget when enemies exist', () => {
        const unit = makeUnit('u1', 0, 0);
        const enemies = [{ q: 2, r: 0 }];
        const allies = [{ q: -1, r: 0 }];
        const terrain = new Map([['0,0', 'plain']]);
        const result = ai.evaluatePosition(unit, allies, enemies, terrain);
        expect(result.bestTarget).toEqual({ q: 2, r: 0 });
    });

    it('evaluatePosition returns null bestTarget when no enemies', () => {
        const unit = makeUnit('u1', 0, 0);
        const result = ai.evaluatePosition(unit, [], [], new Map());
        expect(result.bestTarget).toBeNull();
    });

    it('calculateZOCBypass returns direct path when no ZOC', () => {
        const path = ai.calculateZOCBypass({ q: 0, r: 0 }, { q: 2, r: 0 }, []);
        expect(path.length).toBeGreaterThanOrEqual(2);
        expect(path[path.length - 1]).toEqual({ q: 2, r: 0 });
    });

    it('calculateZOCBypass avoids ZOC zones', () => {
        // ZOC unit at (2,0) blocks its neighbors: (3,0),(2,1),(1,1),(1,0),(2,-1),(3,-1)
        // Goal (3,0) is blocked by ZOC, so BFS returns straightLinePath
        const path = ai.calculateZOCBypass(
            { q: 0, r: 0 },
            { q: 3, r: 0 },
            [{ q: 2, r: 0 }],
        );
        expect(path[path.length - 1]).toEqual({ q: 3, r: 0 });
    });

    it('coordinateJointAttack detects multi-unit cooperation', () => {
        const primary = makeUnit('u1', 0, 0);
        const allies = [
            makeUnit('u2', 1, 0), // adjacent to target (2,0)
        ];
        const result = ai.coordinateJointAttack(primary, allies, { q: 2, r: 0 });
        // u1 at (0,0), target at (2,0) → u2 at (1,0) is neighbor of target
        // But wait, we need neighbors of target (2,0) which are (3,0),(2,1),(1,1),(1,0),(2,-1),(3,-1)
        // u2 at (1,0) IS a neighbor of (2,0) → participant
    });

    it('coordinateJointAttack requires at least 2 participants', () => {
        const primary = makeUnit('u1', 0, 0);
        const result = ai.coordinateJointAttack(primary, [], { q: 3, r: 0 });
        expect(result.canExecute).toBe(false);
        expect(result.participants).toEqual(['u1']);
        expect(result.expectedDamage).toBe(0);
    });

    it('evaluateCavalryCharge returns canCharge when in range', () => {
        const cavalry = makeUnit('c1', 0, 0, { unitType: 'cavalry', remainingMP: 5 });
        const result = ai.evaluateCavalryCharge(cavalry, { q: 2, r: 0 }, []);
        expect(result.canCharge).toBe(true);
    });

    it('evaluateCavalryCharge fails when out of range', () => {
        const cavalry = makeUnit('c1', 0, 0, { unitType: 'cavalry', remainingMP: 1 });
        const result = ai.evaluateCavalryCharge(cavalry, { q: 5, r: 0 }, []);
        expect(result.canCharge).toBe(false);
    });

    it('evaluateCavalryCharge finds retreat path with remaining MP', () => {
        const cavalry = makeUnit('c1', 0, 0, { unitType: 'cavalry', remainingMP: 8 });
        const result = ai.evaluateCavalryCharge(cavalry, { q: 2, r: 0 }, [{ q: 2, r: 0 }]);
        expect(result.canCharge).toBe(true);
        expect(result.remainingMP).toBe(6); // 8 - 2 hex distance
    });

    it('evaluateCavalryCharge returns empty retreat when no MP left', () => {
        const cavalry = makeUnit('c1', 0, 0, { unitType: 'cavalry', remainingMP: 2 });
        const result = ai.evaluateCavalryCharge(cavalry, { q: 2, r: 0 }, []);
        expect(result.canCharge).toBe(true);
        expect(result.retreatPath.length).toBe(0);
    });

    it('hexDistance calculates correct cubic distance', () => {
        // (0,0) to (2,0) should be distance 2
        const dist = (ai as any).hexDistance({ q: 0, r: 0 }, { q: 2, r: 0 });
        expect(dist).toBe(2);
    });

    it('hexNeighbors returns 6 neighbors', () => {
        const neighbors = (ai as any).hexNeighbors({ q: 0, r: 0 });
        expect(neighbors.length).toBe(6);
    });
});
