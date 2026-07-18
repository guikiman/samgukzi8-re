import { describe, it, expect } from 'vitest';
import { DebateCardEngine } from '../src/core/debate_card_engine';

describe('DebateCardEngine', () => {
    const engine = new DebateCardEngine();

    it('should start a debate with correct initial state', () => {
        const state = engine.startDebate(90, 80);
        expect(state.playerLogicHp).toBeGreaterThan(50);
        expect(state.aiLogicHp).toBeGreaterThan(50);
        expect(state.playerCards).toHaveLength(5);
        expect(state.aiCards).toHaveLength(5);
        expect(state.turn).toBe(0);
        expect(state.winner).toBeNull();
    });

    it('should execute a turn and update state', () => {
        let state = engine.startDebate(90, 80);
        state = engine.executeTurn(state, 0);
        expect(state.turn).toBe(1);
        expect(state.resultLog).toHaveLength(1);
    });

    it('should determine a winner after 7 turns', () => {
        let state = engine.startDebate(90, 80);
        for (let i = 0; i < 7; i++) {
            if (state.winner) break;
            state = engine.executeTurn(state, 0);
        }
        expect(state.winner).not.toBeNull();
    });

    it('should give more HP to higher intelligence officers', () => {
        const highInt = engine.startDebate(100, 50);
        const lowInt = engine.startDebate(50, 100);
        expect(highInt.playerLogicHp).toBeGreaterThan(lowInt.playerLogicHp);
    });
});
