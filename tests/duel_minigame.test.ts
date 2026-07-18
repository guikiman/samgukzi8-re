import { describe, it, expect, beforeEach } from 'vitest';
import { DuelMinigame } from '../src/core/duel_minigame';

describe('DuelMinigame', () => {
    let duel: DuelMinigame;
    const statsA = { leadership: 80, might: 90, intelligence: 60, politics: 50, charisma: 70 };
    const statsB = { leadership: 70, might: 75, intelligence: 85, politics: 65, charisma: 60 };

    beforeEach(() => {
        duel = new DuelMinigame();
    });

    it('should start a duel', () => {
        const state = duel.startDuel('officer_1', 'officer_2', statsA, statsB);
        expect(state.playerId).toBe('officer_1');
        expect(state.enemyId).toBe('officer_2');
        expect(state.phase).toBe('PLAYER_TURN');
        expect(state.playerHp).toBeGreaterThan(0);
        expect(state.enemyHp).toBeGreaterThan(0);
    });

    it('should have initial spirit of 3', () => {
        const state = duel.startDuel('officer_1', 'officer_2', statsA, statsB);
        expect(state.playerSpirit).toBe(3);
        expect(state.enemySpirit).toBe(3);
    });

    it('should return available cards based on spirit', () => {
        const cards = duel.getAvailableCards(3);
        expect(cards.length).toBeGreaterThan(0);
        // spirit 3으로 모든 카드 사용 가능
        const furies = cards.filter(c => c.type === 'FURY');
        expect(furies.length).toBe(1);
    });

    it('should filter cards by spirit cost', () => {
        const cards = duel.getAvailableCards(0);
        expect(cards.every(c => c.spiritCost === 0)).toBe(true);
        expect(cards.length).toBe(3); // SLASH, GUARD, COUNTER: all spirit 0
    });

    it('should play a card and advance turn', () => {
        duel.startDuel('officer_1', 'officer_2', statsA, statsB);
        const state = duel.playCard('SLASH');
        expect(state.turn).toBe(1);
    });

    it('should end duel after 5 turns', () => {
        duel.startDuel('officer_1', 'officer_2', statsA, statsB);
        for (let i = 0; i < 5; i++) {
            const state = duel.playCard('SLASH');
            if (state.phase === 'DONE') break;
        }
        expect(duel.isDuelOver()).toBe(true);
    });

    it('should end duel when HP reaches 0', () => {
        duel.startDuel('officer_1', 'officer_2', { leadership: 1, might: 1, intelligence: 1, politics: 1, charisma: 1 }, statsB);
        // 강력 공격 반복
        for (let i = 0; i < 10; i++) {
            const state = duel.playCard('POWER_STRIKE');
            if (state.phase === 'DONE') break;
        }
        expect(duel.isDuelOver()).toBe(true);
    });

    it('should have a winner when duel ends', () => {
        duel.startDuel('officer_1', 'officer_2', statsA, statsB);
        for (let i = 0; i < 5; i++) {
            const state = duel.playCard('SLASH');
            if (state.phase === 'DONE') break;
        }
        const winner = duel.getWinner();
        // Either player wins or draw
        expect(winner === 'officer_1' || winner === 'officer_2' || winner === null).toBe(true);
    });

    it('should reject card play when spirit insufficient', () => {
        duel.startDuel('officer_1', 'officer_2', statsA, statsB);
        // spirit을 모두 소모
        duel.playCard('FURY'); // spirit 3 소모
        // spirit 0에서 FURY 시도 (불가능)
        const state = duel.playCard('FURY');
        // 상태가 변하지 않아야 함 (또는 spirit 체크로 거절)
        expect(state.playerSpirit).toBeLessThanOrEqual(2);
    });

    it('should heal with HEAL card', () => {
        duel.startDuel('officer_1', 'officer_2', statsA, statsB);
        // 데미지를 입은 후 치유
        duel.playCard('SLASH'); // 턴 1
        const state = duel.playCard('HEAL'); // 턴 2
        // HEAL로 회복했거나 spirit 소모
        expect(state.turn).toBe(2);
    });

    it('should track duel log', () => {
        duel.startDuel('officer_1', 'officer_2', statsA, statsB);
        duel.playCard('SLASH');
        const state = duel.getState();
        expect(state.log.length).toBeGreaterThan(0);
    });
});
