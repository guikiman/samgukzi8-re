import { describe, it, expect, beforeEach } from 'vitest';
import { RebellionManager } from '../src/core/rebellion_coup_system';

describe('RebellionManager', () => {
    let manager: RebellionManager;

    beforeEach(() => {
        manager = new RebellionManager();
    });

    it('should succeed coup with favorable conditions', () => {
        // 충성도 < 30, 통솔 > 70, 도시병력 > 세력총병력×0.3
        const result = manager.attemptCoup('officer_1', 'city_1', 5000, 10000, 20, 85);
        expect(result.success).toBe(true);
        expect(result.capturedCityIds).toContain('city_1');
        expect(result.newFactionId).toBeTruthy();
    });

    it('should fail coup with high loyalty', () => {
        const result = manager.attemptCoup('officer_1', 'city_1', 5000, 10000, 50, 85);
        expect(result.success).toBe(false);
        expect(result.message).toContain('충성도');
    });

    it('should fail coup with low leadership', () => {
        const result = manager.attemptCoup('officer_1', 'city_1', 5000, 10000, 20, 60);
        expect(result.success).toBe(false);
        expect(result.message).toContain('통솔력');
    });

    it('should fail coup with insufficient troops', () => {
        const result = manager.attemptCoup('officer_1', 'city_1', 1000, 10000, 20, 85);
        expect(result.success).toBe(false);
        expect(result.message).toContain('병력');
    });

    it('should record coup trigger', () => {
        manager.attemptCoup('officer_1', 'city_1', 5000, 10000, 50, 85);
        const triggers = manager.getTriggers();
        expect(triggers.length).toBe(1);
        expect(triggers[0].triggerType).toBe('COUP');
    });

    it('should succeed revolt with low order and garrison loyalty', () => {
        const result = manager.triggerRevolt('officer_1', 'faction_1', 'city_1', 30, 20);
        expect(result.success).toBe(true);
        expect(result.damagedCityId).toBe('city_1');
    });

    it('should suppress revolt with high order', () => {
        const result = manager.triggerRevolt('officer_1', 'faction_1', 'city_1', 80, 70);
        expect(result.success).toBe(false);
    });

    it('should succeed defection with very low loyalty', () => {
        const result = manager.defectToFaction('officer_1', 'faction_1', 'faction_2', 10);
        expect(result.success).toBe(true);
    });

    it('should reject defection with moderate loyalty', () => {
        const result = manager.defectToFaction('officer_1', 'faction_1', 'faction_2', 50);
        expect(result.success).toBe(false);
    });

    it('should clear triggers', () => {
        manager.attemptCoup('officer_1', 'city_1', 5000, 10000, 20, 85);
        manager.clearTriggers();
        expect(manager.getTriggers().length).toBe(0);
    });
});
