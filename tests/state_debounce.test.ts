import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StateDebounceManager } from '../src/core/state_debounce';

describe('StateDebounceManager', () => {
    let debouncer: StateDebounceManager;

    beforeEach(() => {
        vi.useFakeTimers();
        debouncer = new StateDebounceManager({ windowMs: 50, maxBatchSize: 10 });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should start empty', () => {
        expect(debouncer.pendingCount).toBe(0);
    });

    it('should enqueue updates', () => {
        debouncer.enqueue('officer_1', { leadership: 90 });
        expect(debouncer.pendingCount).toBe(1);
    });

    it('should merge updates for same key', () => {
        debouncer.enqueue('officer_1', { leadership: 90 });
        debouncer.enqueue('officer_1', { might: 80 });
        expect(debouncer.pendingCount).toBe(1);
        const entry = debouncer.peek('officer_1')!;
        expect(entry.updates.leadership).toBe(90);
        expect(entry.updates.might).toBe(80);
    });

    it('should flush on callback', () => {
        const flushed: string[] = [];
        debouncer.setCallback((key, updates) => {
            flushed.push(key);
        });
        debouncer.enqueue('officer_1', { leadership: 90 });
        debouncer.flush();
        expect(flushed).toContain('officer_1');
        expect(debouncer.pendingCount).toBe(0);
    });

    it('should flush a specific key', () => {
        const flushed: string[] = [];
        debouncer.setCallback((key) => { flushed.push(key); });
        debouncer.enqueue('officer_1', { leadership: 90 });
        debouncer.enqueue('officer_2', { might: 70 });
        debouncer.flushKey('officer_1');
        expect(flushed).toEqual(['officer_1']);
        expect(debouncer.pendingCount).toBe(1);
    });

    it('should cancel pending updates', () => {
        debouncer.enqueue('officer_1', { leadership: 90 });
        debouncer.cancel();
        expect(debouncer.pendingCount).toBe(0);
    });

    it('should cancel a specific key', () => {
        debouncer.enqueue('officer_1', { leadership: 90 });
        debouncer.cancelKey('officer_1');
        expect(debouncer.pendingCount).toBe(0);
    });

    it('should auto-flush after windowMs', () => {
        const flushed: string[] = [];
        debouncer.setCallback((key) => { flushed.push(key); });
        debouncer.enqueue('officer_1', { leadership: 90 });
        vi.advanceTimersByTime(100);
        expect(flushed).toContain('officer_1');
    });

    it('should get stats', () => {
        debouncer.enqueue('officer_1', { leadership: 90 });
        const stats = debouncer.getStats();
        expect(stats.pendingCount).toBe(1);
        expect(stats.windowMs).toBe(50);
    });
});
