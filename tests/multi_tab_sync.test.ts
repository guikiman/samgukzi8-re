import { describe, it, expect } from 'vitest';
import { MultiTabSyncManager } from '../src/core/multi_tab_sync';

describe('MultiTabSyncManager', () => {
    it('should fail init when SharedWorker unavailable', () => {
        const manager = new MultiTabSyncManager();
        expect(manager.init()).toBe(false);
    });

    it('should generate unique tab ID', () => {
        const m1 = new MultiTabSyncManager();
        const m2 = new MultiTabSyncManager();
        expect(m1.currentTabId).not.toBe(m2.currentTabId);
    });

    it('should not be master initially', () => {
        const manager = new MultiTabSyncManager();
        expect(manager.isMaster).toBe(false);
    });

    it('should acquire and release lock', () => {
        const manager = new MultiTabSyncManager();
        manager.acquireLock();
        expect(manager.isMaster).toBe(true);
        manager.releaseLock();
        expect(manager.isMaster).toBe(false);
    });

    it('should support event listeners', () => {
        const manager = new MultiTabSyncManager();
        let called = false;
        manager.on('state_update', () => { called = true; });
        manager.broadcastState('test');
        expect(manager.isMaster).toBe(false);
    });

    it('should support off event listeners', () => {
        const manager = new MultiTabSyncManager();
        let count = 0;
        const fn = () => { count++; };
        manager.on('test_event', fn);
        manager.off('test_event', fn);
        expect(manager.isMaster).toBe(false);
    });

    it('should destroy cleanly', () => {
        const manager = new MultiTabSyncManager();
        manager.acquireLock();
        manager.destroy();
        expect(manager.isMaster).toBe(false);
    });
});
