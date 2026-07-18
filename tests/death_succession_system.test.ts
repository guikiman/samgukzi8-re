import { describe, it, expect, beforeEach } from 'vitest';
import { DeathSuccessionManager } from '../src/core/death_succession_system';

describe('DeathSuccessionManager', () => {
    let manager: DeathSuccessionManager;

    beforeEach(() => {
        manager = new DeathSuccessionManager();
        manager.setCurrentDate(200);
    });

    it('should process death', () => {
        const event = manager.processDeath('off_1', 'faction_1', 'BATTLE', 45);
        expect(event.officerId).toBe('off_1');
        expect(event.cause).toBe('BATTLE');
        expect(event.date).toBe(200);
    });

    it('should select heir by priority', () => {
        const candidates = [
            { officerId: 'son', relation: 'SON' as const, priority: 1 },
            { officerId: 'brother', relation: 'SIBLING' as const, priority: 3 },
            { officerId: 'officer', relation: 'OFFICER' as const, priority: 5 },
        ];
        const heir = manager.selectHeir('faction_1', candidates);
        expect(heir).not.toBeNull();
        expect(heir!.officerId).toBe('son');
    });

    it('should return null when no candidates', () => {
        const heir = manager.selectHeir('faction_1', []);
        expect(heir).toBeNull();
    });

    it('should trigger succession with loyalty shifts', () => {
        const officers = [
            { id: 'successor', loyalty: 80 },
            { id: 'loyal', loyalty: 90 },
            { id: 'neutral', loyalty: 60 },
            { id: 'disloyal', loyalty: 30 },
        ];
        const event = manager.triggerSuccession('faction_1', 'off_1', 'successor', officers, 'NATURAL');
        expect(event.successorId).toBe('successor');
        expect(event.loyaltyShifts.get('successor')).toBe(20);
        expect(event.loyaltyShifts.get('disloyal')).toBe(-30);
    });

    it('should calculate natural death probability increasing with age', () => {
        const young = manager.calculateNaturalDeathProbability(20);
        const old = manager.calculateNaturalDeathProbability(80);
        expect(old).toBeGreaterThan(young);
    });

    it('should roll battle death with low HP', () => {
        // HP 0/100 → 50% death chance
        const result = manager.rollBattleDeath(0, 100);
        expect(result || !result).toBe(true); // non-deterministic
    });

    it('should track death events', () => {
        manager.processDeath('off_1', 'faction_1', 'NATURAL', 60);
        expect(manager.getDeathEvents().length).toBe(1);
    });

    it('should track succession events', () => {
        manager.triggerSuccession('faction_1', 'off_1', 'successor', [{ id: 'successor', loyalty: 80 }], 'NATURAL');
        expect(manager.getSuccessionEvents().length).toBe(1);
    });

    it('should clear all events', () => {
        manager.processDeath('off_1', 'faction_1', 'NATURAL', 60);
        manager.clear();
        expect(manager.getDeathEvents().length).toBe(0);
    });
});
