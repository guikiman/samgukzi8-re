import { describe, it, expect, beforeEach } from 'vitest';
import { WorkerErrorRecovery } from '../src/core/worker_error_recovery';

describe('WorkerErrorRecovery', () => {
    let recovery: WorkerErrorRecovery;

    beforeEach(() => {
        recovery = new WorkerErrorRecovery();
    });

    it('should handle a recoverable error', () => {
        const result = recovery.handleError('메모리 부족', 'LOW', 1, 'ai_worker');
        expect(result.success).toBe(true);
        expect(result.action.strategy).toBe('RETRY');
    });

    it('should escalate after max retries', () => {
        for (let i = 0; i < 3; i++) {
            recovery.handleError('메모리 부족', 'LOW', i, 'ai_worker');
        }
        const result = recovery.handleError('메모리 부족', 'LOW', 4, 'ai_worker');
        expect(result.action.strategy).toBe('RETRY');
        expect(result.success).toBe(false);
    });

    it('should handle critical errors with RESTART action', () => {
        const result = recovery.handleError('치명적 오류', 'CRITICAL', 1, 'ai_worker');
        expect(result.action.strategy).toBe('RESTART');
    });

    it('should reset retry count', () => {
        recovery.handleError('오류', 'LOW', 1, 'ai_worker');
        recovery.resetRetryCount('ai_worker');
        const result = recovery.handleError('오류', 'LOW', 2, 'ai_worker');
        expect(result.action.strategy).toBe('RETRY');
        expect(result.success).toBe(true);
    });

    it('should get error stats', () => {
        recovery.handleError('오류1', 'LOW', 1, 'worker_1');
        recovery.handleError('오류2', 'HIGH', 1, 'worker_2');
        const stats = recovery.getErrorStats();
        expect(stats.totalErrors).toBe(2);
        expect(stats.recovered).toBeGreaterThanOrEqual(0);
    });

    it('should get recent errors', () => {
        recovery.handleError('오류', 'LOW', 1, 'worker_1');
        const recent = recovery.getRecentErrors(10);
        expect(recent.length).toBe(1);
        expect(recent[0].message).toBe('오류');
    });

    it('should clear all state', () => {
        recovery.handleError('오류', 'LOW', 1, 'worker_1');
        recovery.clear();
        expect(recovery.getErrorStats().totalErrors).toBe(0);
    });
});