import { describe, it, expect, beforeEach } from 'vitest';
import { EdgeWeightAtomic } from '../src/core/edge_weight_atomic';

describe('EdgeWeightAtomic', () => {
    let atomic: EdgeWeightAtomic;

    beforeEach(() => {
        atomic = new EdgeWeightAtomic();
    });

    it('should register and update affinity', () => {
        atomic.registerEdge({
            source: 'a', target: 'b', type: 'FRIEND', affinity: 50,
            history: [],
        });
        const result = atomic.updateAffinity('a', 'b', 'FRIEND', 10, '선물', 190, 1);
        expect(result.success).toBe(true);
        expect(result.newAffinity).toBe(60);
    });

    it('should clamp affinity to configured max', () => {
        atomic = new EdgeWeightAtomic({ maxAffinity: 100 });
        atomic.registerEdge({
            source: 'a', target: 'b', type: 'FRIEND', affinity: 95,
            history: [],
        });
        const result = atomic.updateAffinity('a', 'b', 'FRIEND', 20, '초과', 190, 1);
        expect(result.clamped).toBe(true);
        expect(result.newAffinity).toBe(100);
    });

    it('should clamp delta to maxDeltaPerUpdate', () => {
        atomic = new EdgeWeightAtomic({ maxDeltaPerUpdate: 30 });
        atomic.registerEdge({
            source: 'a', target: 'b', type: 'FRIEND', affinity: 0,
            history: [],
        });
        const result = atomic.updateAffinity('a', 'b', 'FRIEND', 100, '대량', 190, 1);
        expect(result.newAffinity).toBe(30); // clamped from 100 to 30
    });

    it('should emit events on update', () => {
        const events: string[] = [];
        atomic.subscribe((e) => events.push(e.reason));
        atomic.registerEdge({
            source: 'a', target: 'b', type: 'FRIEND', affinity: 50,
            history: [],
        });
        atomic.updateAffinity('a', 'b', 'FRIEND', 10, '선물', 190, 1);
        expect(events).toContain('선물');
    });

    it('should support unsubscribe', () => {
        let count = 0;
        const unsub = atomic.subscribe(() => { count++; });
        atomic.registerEdge({
            source: 'a', target: 'b', type: 'FRIEND', affinity: 50,
            history: [],
        });
        unsub();
        atomic.updateAffinity('a', 'b', 'FRIEND', 5, '테스트', 190, 1);
        expect(count).toBe(0);
    });

    it('should rollback last change', () => {
        atomic.registerEdge({
            source: 'a', target: 'b', type: 'FRIEND', affinity: 50,
            history: [],
        });
        atomic.updateAffinity('a', 'b', 'FRIEND', 20, '증가', 190, 1);
        expect(atomic.getAffinity('a', 'b', 'FRIEND')).toBe(70);
        atomic.rollbackLastChange('a', 'b', 'FRIEND');
        expect(atomic.getAffinity('a', 'b', 'FRIEND')).toBe(50);
    });

    it('should find edge in reverse direction', () => {
        atomic.registerEdge({
            source: 'a', target: 'b', type: 'FRIEND', affinity: 50,
            history: [],
        });
        const edge = atomic.getEdge('b', 'a', 'FRIEND');
        expect(edge).toBeDefined();
        expect(edge!.affinity).toBe(50);
    });

    it('should return affinity history', () => {
        atomic.registerEdge({
            source: 'a', target: 'b', type: 'FRIEND', affinity: 50,
            history: [],
        });
        atomic.updateAffinity('a', 'b', 'FRIEND', 10, '선물', 190, 1);
        const history = atomic.getChangeHistory('a', 'b', 'FRIEND');
        expect(history.length).toBe(1);
        expect(history[0].event).toBe('선물');
    });

    it('should clear all edges', () => {
        atomic.registerEdge({
            source: 'a', target: 'b', type: 'FRIEND', affinity: 50,
            history: [],
        });
        atomic.clearEdges();
        expect(atomic.getAffinity('a', 'b', 'FRIEND')).toBeNull();
    });
});
