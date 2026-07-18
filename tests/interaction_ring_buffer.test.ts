import { describe, it, expect, beforeEach } from 'vitest';
import { InteractionRingBuffer } from '../src/core/interaction_ring_buffer';

describe('InteractionRingBuffer', () => {
    let buffer: InteractionRingBuffer;

    beforeEach(() => {
        buffer = new InteractionRingBuffer(10);
    });

    it('should start empty', () => {
        expect(buffer.getInteractionCount()).toBe(0);
    });

    it('should push and retrieve records', () => {
        buffer.push({
            sourceId: 'a', targetId: 'b', type: 'MEETING',
            affinityDelta: 5, turn: 1, year: 190, month: 1,
            description: '첫 만남',
        });
        expect(buffer.getInteractionCount()).toBe(1);
        const recent = buffer.getRecentInteractions(10);
        expect(recent.length).toBe(1);
        expect(recent[0].type).toBe('MEETING');
    });

    it('should overwrite oldest when full', () => {
        for (let i = 0; i < 12; i++) {
            buffer.push({
                sourceId: 'a', targetId: 'b', type: 'MEETING',
                affinityDelta: 1, turn: i, year: 190, month: 1,
                description: `이벤트 ${i}`,
            });
        }
        expect(buffer.getInteractionCount()).toBe(10);
        const all = buffer.toArray();
        expect(all.length).toBe(10);
    });

    it('should query interactions between two officers', () => {
        buffer.push({
            sourceId: 'a', targetId: 'b', type: 'GIFT',
            affinityDelta: 10, turn: 1, year: 190, month: 1,
            description: '선물',
        });
        buffer.push({
            sourceId: 'a', targetId: 'c', type: 'MEETING',
            affinityDelta: 5, turn: 1, year: 190, month: 1,
            description: '다른 사람',
        });
        const between = buffer.getInteractionsBetween('a', 'b');
        expect(between.length).toBe(1);
    });

    it('should query by type', () => {
        buffer.push({
            sourceId: 'a', targetId: 'b', type: 'GIFT',
            affinityDelta: 10, turn: 1, year: 190, month: 1,
            description: '',
        });
        buffer.push({
            sourceId: 'a', targetId: 'b', type: 'BATTLE_TOGETHER',
            affinityDelta: 15, turn: 2, year: 190, month: 2,
            description: '',
        });
        const gifts = buffer.getInteractionsByType('GIFT');
        expect(gifts.length).toBe(1);
    });

    it('should return last interaction between two officers', () => {
        buffer.push({
            sourceId: 'a', targetId: 'b', type: 'MEETING',
            affinityDelta: 5, turn: 1, year: 190, month: 1,
            description: '첫만남',
        });
        buffer.push({
            sourceId: 'a', targetId: 'b', type: 'GIFT',
            affinityDelta: 10, turn: 2, year: 190, month: 2,
            description: '선물',
        });
        const last = buffer.getLastInteractionBetween('a', 'b');
        expect(last).toBeDefined();
        expect(last!.type).toBe('GIFT');
    });

    it('should calculate interaction frequency', () => {
        buffer.push({
            sourceId: 'a', targetId: 'b', type: 'MEETING',
            affinityDelta: 5, turn: 3, year: 190, month: 1,
            description: '',
        });
        buffer.push({
            sourceId: 'a', targetId: 'c', type: 'MEETING',
            affinityDelta: 5, turn: 5, year: 190, month: 2,
            description: '',
        });
        expect(buffer.getInteractionFrequency('a', 3)).toBe(2);
        expect(buffer.getInteractionFrequency('a', 6)).toBe(0);
    });

    it('should clear all records', () => {
        buffer.push({
            sourceId: 'a', targetId: 'b', type: 'MEETING',
            affinityDelta: 5, turn: 1, year: 190, month: 1,
            description: '',
        });
        buffer.clear();
        expect(buffer.getInteractionCount()).toBe(0);
    });
});
