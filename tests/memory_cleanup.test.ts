import { describe, it, expect } from 'vitest';
import { MemoryCleanupManager } from '../src/core/memory_cleanup';

describe('MemoryCleanupManager', () => {
    let manager: MemoryCleanupManager;

    beforeEach(() => {
        manager = new MemoryCleanupManager();
    });

    it('should start and stop', () => {
        manager.start();
        manager.stop();
        expect(manager.getResourceCount()).toBe(0);
    });

    it('should track geometry', () => {
        manager.trackGeometry('geo_1', 'Test Geometry');
        expect(manager.getResourceCount('geometry')).toBe(1);
    });

    it('should track texture', () => {
        manager.trackTexture('tex_1', 'Test Texture');
        expect(manager.getResourceCount('texture')).toBe(1);
    });

    it('should track material', () => {
        manager.trackMaterial('mat_1', 'Test Material');
        expect(manager.getResourceCount('material')).toBe(1);
    });

    it('should track audio context', () => {
        manager.trackAudioContext('ctx_1', 'Test AudioContext');
        expect(manager.getResourceCount('audiocontext')).toBe(1);
    });

    it('should mark resource as disposed', () => {
        manager.trackGeometry('geo_1', 'Test');
        expect(manager.markDisposed('geo_1')).toBe(true);
    });

    it('should return false for unknown resource', () => {
        expect(manager.markDisposed('unknown')).toBe(false);
    });

    it('should generate report', () => {
        manager.trackGeometry('geo_1', 'Test');
        manager.markDisposed('geo_1');
        const report = manager.generateReport();
        expect(report.trackedObjects).toBe(1);
        expect(report.disposedObjects).toBe(1);
    });

    it('should detect leaks in report', () => {
        for (let i = 0; i < 600; i++) {
            manager.trackGeometry(`geo_${i}`, `Geometry ${i}`);
        }
        const report = manager.generateReport();
        expect(report.leakedObjects).toBe(600);
        expect(report.warnings.length).toBeGreaterThan(0);
    });

    it('should clear all resources', () => {
        manager.trackGeometry('geo_1', 'Test');
        manager.clear();
        expect(manager.getResourceCount()).toBe(0);
    });

    it('should force GC', () => {
        manager.trackGeometry('geo_1', 'Test');
        manager.trackGeometry('geo_2', 'Test');
        manager.forceGC();
        const report = manager.generateReport();
        expect(report.trackedObjects).toBe(2);
    });
});
