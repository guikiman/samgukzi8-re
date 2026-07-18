import { describe, it, expect } from 'vitest';
import { DuelDeckBuilder, DuelTurnProcessor } from '../src/core/duel_deck_engine';

describe('DuelDeckBuilder', () => {
    const builder = new DuelDeckBuilder();

    it('should build a 15-card deck', () => {
        const deck = builder.buildDeck('officer_1', 90, ['BLADE']);
        expect(deck.cards).toHaveLength(15);
        expect(deck.ownerId).toBe('officer_1');
    });

    it('should draw cards from deck', () => {
        const deck = builder.buildDeck('officer_1', 80, []);
        const card = builder.drawCard(deck);
        expect(card).not.toBeNull();
        expect(deck.cards).toHaveLength(14);
    });

    it('should return null when deck is empty', () => {
        const deck = { cards: [], ownerId: 'test' };
        const card = builder.drawCard(deck);
        expect(card).toBeNull();
    });

    it('should generate more SPECIAL cards for high might', () => {
        const highMightDeck = builder.buildDeck('officer_1', 300, ['BLADE']);
        const lowMightDeck = builder.buildDeck('officer_2', 20, []);
        const highSpecials = highMightDeck.cards.filter(c => c.type === 'SPECIAL').length;
        const lowSpecials = lowMightDeck.cards.filter(c => c.type === 'SPECIAL').length;
        expect(highSpecials).toBeGreaterThanOrEqual(lowSpecials);
    });
});

describe('DuelTurnProcessor', () => {
    const processor = new DuelTurnProcessor();

    it('should start a duel with correct initial state', () => {
        const state = processor.startDuel('player_1', 90, 'ai_1', 80, ['BLADE'], []);
        expect(state.playerHp).toBe(100);
        expect(state.aiHp).toBe(100);
        expect(state.turn).toBe(0);
        expect(state.maxTurns).toBe(5);
        expect(state.winner).toBeNull();
    });

    it('should process a turn and update state', () => {
        const builder = new DuelDeckBuilder();
        const playerDeck = builder.buildDeck('player_1', 90, ['BLADE']);
        const aiDeck = builder.buildDeck('ai_1', 80, []);
        const processor = new DuelTurnProcessor();
        let state = processor.startDuel('player_1', 90, 'ai_1', 80, ['BLADE'], []);

        state = processor.processTurn(state, playerDeck, aiDeck);
        expect(state.turn).toBe(1);
        expect(state.results).toHaveLength(1);
        expect(state.winner).toBeNull();
    });

    it('should determine a winner after 5 turns', () => {
        const processor = new DuelTurnProcessor();
        const builder = new DuelDeckBuilder();
        const playerDeck = builder.buildDeck('player_1', 90, ['BLADE']);
        const aiDeck = builder.buildDeck('ai_1', 80, []);
        let state = processor.startDuel('player_1', 90, 'ai_1', 80, ['BLADE'], []);

        for (let i = 0; i < 5; i++) {
            state = processor.processTurn(state, playerDeck, aiDeck);
        }

        expect(state.winner).not.toBeNull();
        expect(state.turn).toBeLessThanOrEqual(5);
    });
});
