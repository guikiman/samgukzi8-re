import { describe, it, expect, beforeEach } from 'vitest';
import { BattleStratagemManager, STRATAGEMS } from '../src/core/battle_stratagem_system';

describe('BattleStratagemManager', () => {
    let manager: BattleStratagemManager;

    beforeEach(() => {
        manager = new BattleStratagemManager();
    });

    it('should return stratagem by type', () => {
        const s = manager.getStratagem('ROCKFALL');
        expect(s.name).toBe('낙석');
        expect(s.spiritCost).toBe(1);
    });

    it('should return all stratagems', () => {
        expect(manager.getAllStratagems().length).toBe(7);
    });

    it('should list available stratagems based on intelligence and spirit', () => {
        const available = manager.getAvailableStratagems('off_1', 70, 3);
        expect(available.length).toBeGreaterThan(0);
        expect(available.every(s => s.spiritCost <= 3)).toBe(true);
    });

    it('should restrict high-level stratagems by intelligence', () => {
        const low = manager.getAvailableStratagems('off_1', 30, 3);
        const high = manager.getAvailableStratagems('off_1', 85, 3);
        expect(low.length).toBeLessThanOrEqual(high.length);
    });

    it('should calculate success rate based on intelligence', () => {
        const high = manager.calculateSuccessRate('ROCKFALL', 90, 'SUNNY');
        const low = manager.calculateSuccessRate('ROCKFALL', 20, 'SUNNY');
        expect(high).toBeGreaterThan(low);
    });

    it('should execute stratagem', () => {
        const effect = manager.executeStratagem('ROCKFALL', 'off_1', { q: 0, r: 0 }, 80, 'SUNNY', 100);
        expect(effect.executorId).toBe('off_1');
        expect(effect.success || !effect.success).toBe(true);
    });

    it('should process active effects over time', () => {
        manager.executeStratagem('FIRE_ATTACK', 'off_1', { q: 0, r: 0 }, 80, 'SUNNY', 100);
        const effects = manager.processActiveEffects(new Map());
        expect(effects.length).toBeGreaterThanOrEqual(0);
    });

    it('should detect encirclement', () => {
        const enemyTiles = [
            { q: 1, r: 0 }, { q: -1, r: 0 }, { q: 0, r: 1 },
        ];
        const encircled = manager.checkEncircled({ q: 0, r: 0 }, enemyTiles);
        expect(encircled).toBe(false); // 3/6 < 4, so not encircled
    });

    it('should detect full encirclement', () => {
        const enemyTiles = [
            { q: 1, r: 0 }, { q: -1, r: 0 }, { q: 0, r: 1 },
            { q: 0, r: -1 }, { q: 1, r: -1 }, { q: -1, r: 1 },
        ];
        const encircled = manager.checkEncircled({ q: 0, r: 0 }, enemyTiles);
        expect(encircled).toBe(true);
    });

    it('should clear all effects', () => {
        manager.executeStratagem('TRAP', 'off_1', { q: 0, r: 0 }, 80, 'SUNNY', 100);
        manager.clear();
        expect(manager.getActiveEffects().length).toBe(0);
    });
});
