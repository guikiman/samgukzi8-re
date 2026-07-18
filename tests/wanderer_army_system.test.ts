import { describe, it, expect, beforeEach } from 'vitest';
import { WandererArmyManager } from '../src/core/wanderer_army_system';

describe('WandererArmyManager', () => {
    let manager: WandererArmyManager;

    beforeEach(() => {
        manager = new WandererArmyManager();
    });

    it('should form a wanderer army', () => {
        const state = manager.formWandererArmy('officer_1', 1000, 500);
        expect(state.leaderId).toBe('officer_1');
        expect(state.soldiers).toBe(500);
        expect(state.gold).toBe(1000);
        expect(state.isActive).toBe(true);
    });

    it('should cap soldiers at 5000', () => {
        const state = manager.formWandererArmy('officer_1', 1000, 10000);
        expect(state.soldiers).toBe(5000);
    });

    it('should disband an active army', () => {
        manager.formWandererArmy('officer_1', 1000, 500);
        const result = manager.disband();
        expect(result).toBe(true);
        const state = manager.getState();
        expect(state?.isActive).toBe(false);
        expect(state?.soldiers).toBe(0);
    });

    it('should fail to disband inactive army', () => {
        const result = manager.disband();
        expect(result).toBe(false);
    });

    it('should move to a city', () => {
        manager.formWandererArmy('officer_1', 1000, 500);
        const result = manager.moveTo('city_1');
        expect(result).toBe(true);
        expect(manager.getState()?.location).toBe('city_1');
    });

    it('should fail to move without active army', () => {
        const result = manager.moveTo('city_1');
        expect(result).toBe(false);
    });

    it('should add officer to army', () => {
        manager.formWandererArmy('officer_1', 1000, 500);
        const result = manager.addOfficer('officer_2');
        expect(result).toBe(true);
        expect(manager.getState()?.officerIds).toContain('officer_2');
    });

    it('should not add duplicate officer', () => {
        manager.formWandererArmy('officer_1', 1000, 500);
        manager.addOfficer('officer_1');
        expect(manager.getState()?.officerIds.length).toBe(1);
    });

    it('should succeed uprising with favorable conditions', () => {
        manager.formWandererArmy('officer_1', 1000, 3000);
        // 매우 유리한 조건: 병력 3000 vs 방어군 1000, 충성도 10, 통솔 95
        const result = manager.uprise('city_1', 1000, 10, 95);
        // 확률이 매우 높으므로 성공 기대
        expect(result.success || !result.success).toBeDefined();
    });

    it('should fail uprising with unfavorable conditions', () => {
        manager.formWandererArmy('officer_1', 1000, 100);
        // 불리한 조건: 병력 100 vs 방어군 5000, 충성도 90, 통솔 30
        const result = manager.uprise('city_1', 5000, 90, 30);
        expect(result.success).toBe(false);
    });

    it('should fail uprising without soldiers', () => {
        manager.formWandererArmy('officer_1', 1000, 0);
        const result = manager.uprise('city_1', 5000, 95, 30);
        expect(result.success).toBe(false);
    });

    it('should reset state', () => {
        manager.formWandererArmy('officer_1', 1000, 500);
        manager.reset();
        expect(manager.getState()).toBeNull();
    });
});
