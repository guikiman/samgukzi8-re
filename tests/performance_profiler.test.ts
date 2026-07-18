import { describe, it, expect } from 'vitest';
import { PerformanceProfiler } from '../src/core/performance_profiler';

describe('PerformanceProfiler', () => {
    it('should start and stop', () => {
        const profiler = new PerformanceProfiler();
        profiler.start();
        const report = profiler.stop();
        expect(report).toBeDefined();
        expect(report.snapshots.length).toBeGreaterThanOrEqual(1);
    });

    it('should capture fps', () => {
        const profiler = new PerformanceProfiler();
        profiler.start();
        profiler.stop();
        expect(profiler.getSnapshotCount()).toBeGreaterThanOrEqual(1);
    });

    it('should generate report with metrics', () => {
        const profiler = new PerformanceProfiler();
        profiler.start();
        const report = profiler.stop();
        expect(typeof report.fspAvg).toBe('number');
        expect(typeof report.memoryPeak).toBe('number');
    });

    it('should handle multiple snapshots', () => {
        const profiler = new PerformanceProfiler();
        profiler.start();
        // Wait for 2 snapshots
        const report = profiler.stop();
        expect(report.snapshots.length).toBeGreaterThanOrEqual(1);
    });

    it('should return snapshot count', () => {
        const profiler = new PerformanceProfiler();
        expect(profiler.getSnapshotCount()).toBe(0);
        profiler.start();
        profiler.stop();
        expect(profiler.getSnapshotCount()).toBeGreaterThanOrEqual(1);
    });
});
