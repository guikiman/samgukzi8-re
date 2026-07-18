import { describe, it, expect, beforeEach } from 'vitest';
import { DebateMinigame } from '../src/core/debate_minigame';

describe('DebateMinigame', () => {
    let debate: DebateMinigame;
    const statsA = { leadership: 70, might: 60, intelligence: 90, politics: 80, charisma: 75 };
    const statsB = { leadership: 65, might: 70, intelligence: 75, politics: 85, charisma: 70 };

    beforeEach(() => {
        debate = new DebateMinigame();
    });

    it('should start a debate', () => {
        const state = debate.startDebate('officer_1', 'officer_2', statsA, statsB, '정세 논의');
        expect(state.playerId).toBe('officer_1');
        expect(state.enemyId).toBe('officer_2');
        expect(state.topic).toBe('정세 논의');
        expect(state.playerScore).toBe(50);
        expect(state.enemyScore).toBe(50);
    });

    it('should have higher spirit for intelligent officers', () => {
        const highInt = { leadership: 50, might: 50, intelligence: 100, politics: 50, charisma: 50 };
        const lowInt = { leadership: 50, might: 50, intelligence: 30, politics: 50, charisma: 50 };
        const state = debate.startDebate('officer_1', 'officer_2', highInt, lowInt);
        expect(state.playerSpirit).toBeGreaterThanOrEqual(3);
        expect(state.enemySpirit).toBeLessThanOrEqual(5);
    });

    it('should return available cards based on spirit', () => {
        const cards = debate.getAvailableCards(3);
        expect(cards.length).toBeGreaterThan(0);
        const wisdoms = cards.filter(c => c.type === 'WISDOM');
        expect(wisdoms.length).toBe(1); // wisdom costs 3 spirit
    });

    it('should filter cards by spirit', () => {
        const cards = debate.getAvailableCards(0);
        expect(cards.every(c => c.spiritCost === 0)).toBe(true);
    });

    it('should play a card and advance turn', () => {
        debate.startDebate('officer_1', 'officer_2', statsA, statsB);
        const state = debate.playCard('LOGIC');
        expect(state.turn).toBe(1);
    });

    it('should end debate after 5 turns', () => {
        debate.startDebate('officer_1', 'officer_2', statsA, statsB);
        for (let i = 0; i < 5; i++) {
            const state = debate.playCard('LOGIC');
            if (state.phase === 'DONE') break;
        }
        expect(debate.isDebateOver()).toBe(true);
    });

    it('should end debate when score reaches 0', () => {
        const weakStats = { leadership: 1, might: 1, intelligence: 1, politics: 1, charisma: 1 };
        debate.startDebate('officer_1', 'officer_2', weakStats, statsA);
        for (let i = 0; i < 10; i++) {
            const state = debate.playCard('LOGIC');
            if (state.phase === 'DONE') break;
        }
        expect(debate.isDebateOver()).toBe(true);
    });

    it('should have a winner when debate ends', () => {
        debate.startDebate('officer_1', 'officer_2', statsA, statsB);
        for (let i = 0; i < 5; i++) {
            const state = debate.playCard('LOGIC');
            if (state.phase === 'DONE') break;
        }
        const winner = debate.getWinner();
        expect(winner === 'officer_1' || winner === 'officer_2' || winner === null).toBe(true);
    });

    it('should return debate result', () => {
        debate.startDebate('officer_1', 'officer_2', statsA, statsB);
        for (let i = 0; i < 5; i++) {
            const state = debate.playCard('LOGIC');
            if (state.phase === 'DONE') break;
        }
        const result = debate.getDebateResult();
        expect(result.winner === 'officer_1' || result.winner === 'officer_2' || result.winner === null).toBe(true);
        expect(result.turnsUsed).toBeGreaterThanOrEqual(0);
    });

    it('should track debate log', () => {
        debate.startDebate('officer_1', 'officer_2', statsA, statsB);
        debate.playCard('LOGIC');
        const state = debate.getState();
        expect(state.log.length).toBeGreaterThan(0);
    });
});
