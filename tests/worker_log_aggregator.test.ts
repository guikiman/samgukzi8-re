import { describe, it, expect, beforeEach } from 'vitest';
import { WorkerLogAggregator } from '../src/core/worker_log_aggregator';

describe('WorkerLogAggregator', () => {
    let aggregator: WorkerLogAggregator;

    beforeEach(() => {
        aggregator = new WorkerLogAggregator(100);
    });

    it('should start empty', () => {
        const stats = aggregator.getStats();
        expect(stats.totalLogs).toBe(0);
    });

    it('should log messages at different levels', () => {
        aggregator.debug('w1', '디버그', 1);
        aggregator.info('w1', '정보', 1);
        aggregator.warn('w1', '경고', 1);
        aggregator.error('w1', '오류', 1);
        aggregator.fatal('w1', '치명', 1);
        expect(aggregator.getStats().totalLogs).toBe(5);
    });

    it('should query logs with filters', () => {
        aggregator.info('w1', '메시지1', 1);
        aggregator.error('w1', '오류1', 1);
        aggregator.info('w2', '메시지2', 1);
        const w1Logs = aggregator.query({ workerId: 'w1' });
        expect(w1Logs.length).toBe(2);
        const errorLogs = aggregator.query({ minLevel: 'ERROR' });
        expect(errorLogs.length).toBe(1);
    });

    it('should get worker-specific logs', () => {
        aggregator.info('w1', '메시지1', 1);
        aggregator.info('w2', '메시지2', 1);
        const w1Logs = aggregator.getWorkerLogs('w1');
        expect(w1Logs.length).toBe(1);
    });

    it('should get errors filtered by level', () => {
        aggregator.warn('w1', '경고', 1);
        aggregator.error('w1', '오류', 1);
        aggregator.fatal('w1', '치명', 1);
        const errors = aggregator.getErrors('ERROR', 10);
        expect(errors.length).toBe(2); // ERROR + FATAL
    });

    it('should get recent logs', () => {
        aggregator.info('w1', '첫번째', 1);
        aggregator.info('w1', '두번째', 2);
        const recent = aggregator.getRecentLogs(1);
        expect(recent.length).toBe(1);
        expect(recent[0].message).toBe('두번째');
    });

    it('should export logs as formatted string', () => {
        aggregator.info('w1', '테스트', 1);
        const exported = aggregator.exportLogs();
        expect(exported).toContain('[INFO]');
        expect(exported).toContain('테스트');
    });

    it('should respect maxLogs limit', () => {
        const small = new WorkerLogAggregator(3);
        small.info('w1', '1', 1);
        small.info('w1', '2', 1);
        small.info('w1', '3', 1);
        small.info('w1', '4', 1);
        expect(small.getStats().totalLogs).toBe(3);
    });

    it('should clear all logs', () => {
        aggregator.info('w1', '테스트', 1);
        aggregator.clear();
        expect(aggregator.getStats().totalLogs).toBe(0);
    });
});
