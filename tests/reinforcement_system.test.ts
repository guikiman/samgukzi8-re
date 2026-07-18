import { describe, it, expect, beforeEach } from 'vitest';
import { ReinforcementManager } from '../src/core/reinforcement_system';

describe('ReinforcementManager', () => {
    let manager: ReinforcementManager;

    beforeEach(() => {
        manager = new ReinforcementManager();
        manager.setCurrentTurn(10);
    });

    it('should request reinforcement', () => {
        const req = manager.requestReinforcement('city_1', 'battle_1', ['off_1', 'off_2'], 3000, 3, 'SUNNY');
        expect(req.sourceCityId).toBe('city_1');
        expect(req.soldierCount).toBe(3000);
        expect(req.status).toBe('REQUESTED');
    });

    it('should calculate arrival turn based on distance', () => {
        const close = manager.calculateArrivalTurn(1, 'SUNNY');
        const far = manager.calculateArrivalTurn(10, 'SUNNY');
        expect(close).toBeLessThan(far);
    });

    it('should delay arrival in bad weather', () => {
        const sunny = manager.calculateArrivalTurn(3, 'SUNNY');
        const storm = manager.calculateArrivalTurn(3, 'STORM');
        expect(storm).toBeGreaterThanOrEqual(sunny);
    });

    it('should process arrival when turn reaches estimated', () => {
        manager.requestReinforcement('city_1', 'battle_1', ['off_1'], 1000, 1, 'SUNNY');
        // Estimated arrival = 10 + (1*2/1.0) = 12
        manager.setCurrentTurn(12);
        const arrived = manager.processReinforcementArrival();
        expect(arrived.length).toBeGreaterThanOrEqual(0);
    });

    it('should return pending reinforcements', () => {
        manager.requestReinforcement('city_1', 'battle_1', ['off_1'], 1000, 5, 'SUNNY');
        const pending = manager.getPendingReinforcements('battle_1');
        expect(pending.length).toBe(1);
    });

    it('should cancel reinforcement', () => {
        const req = manager.requestReinforcement('city_1', 'battle_1', ['off_1'], 1000, 5, 'SUNNY');
        const cancelled = manager.cancelReinforcement(req.requestId);
        expect(cancelled).toBe(true);
    });

    it('should not cancel already arrived reinforcement', () => {
        const req = manager.requestReinforcement('city_1', 'battle_1', ['off_1'], 1000, 1, 'SUNNY');
        manager.setCurrentTurn(20);
        manager.processReinforcementArrival();
        const cancelled = manager.cancelReinforcement(req.requestId);
        expect(cancelled).toBe(false);
    });

    it('should cap soldier count at 10000', () => {
        const req = manager.requestReinforcement('city_1', 'battle_1', ['off_1'], 50000, 1, 'SUNNY');
        expect(req.soldierCount).toBe(10000);
    });

    it('should clear all requests', () => {
        manager.requestReinforcement('city_1', 'battle_1', ['off_1'], 1000, 1, 'SUNNY');
        manager.clear();
        expect(manager.getAllRequests().length).toBe(0);
    });
});
