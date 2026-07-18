import { describe, it, expect, beforeEach } from 'vitest';
import { UnitPromotionManager } from '../src/core/unit_promotion_system';

describe('UnitPromotionManager', () => {
    let manager: UnitPromotionManager;

    beforeEach(() => {
        manager = new UnitPromotionManager();
    });

    it('should return promotion paths', () => {
        const paths = manager.getPromotionPath('INFANTRY');
        expect(paths.length).toBe(1);
        expect(paths[0].to).toBe('HEAVY_INFANTRY');
    });

    it('should return empty path for elite classes', () => {
        const paths = manager.getPromotionPath('ELITE_INFANTRY');
        expect(paths.length).toBe(0);
    });

    it('should set unit class', () => {
        manager.setUnitClass('officer_1', 'INFANTRY');
        expect(manager.getCurrentClass('officer_1')).toBe('INFANTRY');
    });

    it('should add experience', () => {
        manager.setUnitClass('officer_1', 'INFANTRY');
        const exp = manager.addExp('officer_1', 50);
        expect(exp).toBe(50);
    });

    it('should promote with sufficient exp and gold', () => {
        manager.setUnitClass('officer_1', 'INFANTRY');
        manager.addExp('officer_1', 100);
        const result = manager.promoteUnit('officer_1', 'HEAVY_INFANTRY', 500);
        expect(result.success).toBe(true);
        expect(result.statBonus.might).toBe(5);
    });

    it('should reject promotion with insufficient exp', () => {
        manager.setUnitClass('officer_1', 'INFANTRY');
        const result = manager.promoteUnit('officer_1', 'HEAVY_INFANTRY', 500);
        expect(result.success).toBe(false);
        expect(result.message).toContain('숙련도');
    });

    it('should reject promotion with insufficient gold', () => {
        manager.setUnitClass('officer_1', 'INFANTRY');
        manager.addExp('officer_1', 100);
        const result = manager.promoteUnit('officer_1', 'HEAVY_INFANTRY', 50);
        expect(result.success).toBe(false);
        expect(result.message).toContain('금');
    });

    it('should reject invalid promotion path', () => {
        manager.setUnitClass('officer_1', 'INFANTRY');
        const result = manager.promoteUnit('officer_1', 'ELITE_CAVALRY', 500);
        expect(result.success).toBe(false);
    });

    it('should calculate unit stats with officer bonus', () => {
        const stats = manager.getUnitStats('INFANTRY', { leadership: 80, might: 70, intelligence: 50, politics: 50, charisma: 50 });
        expect(stats.attack).toBeGreaterThanOrEqual(10);
        expect(stats.defense).toBeGreaterThanOrEqual(10);
    });

    it('should return all promotion paths', () => {
        expect(manager.getAllPromotionPaths().length).toBe(6);
    });
});
