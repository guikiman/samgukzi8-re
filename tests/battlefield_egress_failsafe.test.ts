import { describe, it, expect } from 'vitest';
import { BattlefieldEgressFailsafe } from '../src/core/battlefield_egress_failsafe';

describe('BattlefieldEgressFailsafe', () => {
    const failsafe = new BattlefieldEgressFailsafe();

    it('should clear all timers on cleanup', () => {
        const timer = setInterval(() => {}, 1000);
        const timeout = setTimeout(() => {}, 1000);
        failsafe.registerTimer(timer);
        failsafe.registerTimeout(timeout);
        expect(failsafe.getActiveTimerCount()).toBe(2);

        const result = failsafe.executeCleanup('ANNIHILATION');
        expect(result.timersCleared).toBe(2);
        expect(result.reason).toBe('ANNIHILATION');
        expect(failsafe.getActiveTimerCount()).toBe(0);
    });

    it('should report heap freed based on registered resources', () => {
        const f = new BattlefieldEgressFailsafe();
        f.registerAudioNodes(5);
        f.registerLOSData(10);
        const result = f.executeCleanup('RETREAT');
        expect(result.audioNodesReleased).toBe(5);
        expect(result.losDataCleared).toBe(10);
        expect(result.heapFreed).toBe(5 * 1024 + 10 * 64);
    });

    it('should handle multiple cleanup reasons', () => {
        const f = new BattlefieldEgressFailsafe();
        const r1 = f.executeCleanup('TIMEOUT');
        expect(r1.reason).toBe('TIMEOUT');

        const r2 = f.executeCleanup('SURRENDER');
        expect(r2.reason).toBe('SURRENDER');
    });

    it('should report zero resources when none registered', () => {
        const f = new BattlefieldEgressFailsafe();
        const result = f.executeCleanup('RETREAT');
        expect(result.timersCleared).toBe(0);
        expect(result.audioNodesReleased).toBe(0);
        expect(result.losDataCleared).toBe(0);
        expect(result.heapFreed).toBe(0);
    });
});
