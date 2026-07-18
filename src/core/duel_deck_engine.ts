/**
 * [B1-B2] 일기토 덱 빌더 + 턴 프로세서 — Duel Deck Engine
 *
 * DuelDeckBuilder:
 *   1. 무장 무력/특기 기반 15장 카드 덱 생성
 *   2. 카드 타입: ATTACK / DEFEND / SPECIAL / DODGE / SPIRIT
 *   3. 무력 높을수록 SPECIAL 확률 증가
 *
 * DuelTurnProcessor:
 *   1. 플레이어 vs AI 카드 매칭 (5턴)
 *   2. 상성 테이블: SPECIAL > ATTACK > DODGE > SPECIAL
 *   3. DEFEND > SPECIAL (막기)
 *   4. SPIRIT: 다음 턴 SPECIAL 데미지 2배
 */

export type DuelCardType = 'ATTACK' | 'DEFEND' | 'SPECIAL' | 'DODGE' | 'SPIRIT';

export interface DuelCard {
    readonly type: DuelCardType;
    readonly damage: number;
    readonly spiritCost: number;
}

export interface DuelDeck {
    readonly cards: DuelCard[];
    readonly ownerId: string;
}

export interface DuelTurnResult {
    readonly turn: number;
    readonly playerCard: DuelCard;
    readonly aiCard: DuelCard;
    readonly playerDamage: number;
    readonly aiDamage: number;
    readonly playerSpiritGain: number;
    readonly aiSpiritGain: number;
    readonly description: string;
}

export interface DuelBattleState {
    readonly playerHp: number;
    readonly aiHp: number;
    readonly playerSpirit: number;
    readonly aiSpirit: number;
    readonly turn: number;
    readonly maxTurns: number;
    readonly results: DuelTurnResult[];
    readonly winner: 'player' | 'ai' | null;
}

const CARD_COST: Record<DuelCardType, number> = {
    ATTACK: 0, DEFEND: 0, SPECIAL: 2, DODGE: 0, SPIRIT: 1,
};

const CARD_DAMAGE: Record<DuelCardType, number> = {
    ATTACK: 15, DEFEND: 0, SPECIAL: 35, DODGE: 0, SPIRIT: 0,
};

const COUNTER_TABLE: Record<DuelCardType, DuelCardType> = {
    ATTACK: 'DODGE',
    DEFEND: 'SPECIAL',
    SPECIAL: 'ATTACK',
    DODGE: 'SPECIAL',
    SPIRIT: 'ATTACK',
};

export class DuelDeckBuilder {
    buildDeck(officerId: string, might: number, skills: string[]): DuelDeck {
        const cards: DuelCard[] = [];
        const specialBonus = skills.includes('BLADE') || skills.includes('SPEAR') ? 0.1 : 0;
        const specialChance = Math.min(0.3, (might / 300) + specialBonus);

        const distribution: { type: DuelCardType; weight: number }[] = [
            { type: 'ATTACK', weight: 0.35 - specialChance },
            { type: 'DEFEND', weight: 0.25 },
            { type: 'SPECIAL', weight: specialChance },
            { type: 'DODGE', weight: 0.2 },
            { type: 'SPIRIT', weight: 0.2 },
        ];

        const totalWeight = distribution.reduce((s, d) => s + d.weight, 0);
        for (let i = 0; i < 15; i++) {
            let roll = Math.random() * totalWeight;
            for (const dist of distribution) {
                roll -= dist.weight;
                if (roll <= 0) {
                    cards.push({ type: dist.type, damage: CARD_DAMAGE[dist.type], spiritCost: CARD_COST[dist.type] });
                    break;
                }
            }
        }
        return { cards, ownerId: officerId };
    }

    drawCard(deck: DuelDeck): DuelCard | null {
        if (deck.cards.length === 0) return null;
        return deck.cards.shift()!;
    }
}

export class DuelTurnProcessor {
    private readonly MAX_TURNS = 5;

    startDuel(playerId: string, playerMight: number, aiId: string, aiMight: number, playerSkills: string[], aiSkills: string[]): DuelBattleState {
        const builder = new DuelDeckBuilder();
        const playerDeck = builder.buildDeck(playerId, playerMight, playerSkills);
        const aiDeck = builder.buildDeck(aiId, aiMight, aiSkills);

        return {
            playerHp: 100,
            aiHp: 100,
            playerSpirit: 0,
            aiSpirit: 0,
            turn: 0,
            maxTurns: this.MAX_TURNS,
            results: [],
            winner: null,
        };
    }

    processTurn(state: DuelBattleState, playerDeck: DuelDeck, aiDeck: DuelDeck): DuelBattleState {
        if (state.winner) return state;
        if (state.turn >= this.MAX_TURNS) {
            return { ...state, winner: state.playerHp > state.aiHp ? 'player' : 'ai' };
        }

        const builder = new DuelDeckBuilder();
        const playerCard = builder.drawCard(playerDeck)!;
        const aiCard = builder.drawCard(aiDeck)!;

        const newState = { ...state };
        newState.turn++;

        const counterForPlayer = COUNTER_TABLE[playerCard.type];
        const counterForAI = COUNTER_TABLE[aiCard.type];

        let playerDamage = 0;
        let aiDamage = 0;
        let playerSpiritGain = playerCard.spiritCost > 0 ? 0 : 5;
        let aiSpiritGain = aiCard.spiritCost > 0 ? 0 : 5;
        let description = '';

        if (playerCard.type === 'SPIRIT') {
            newState.playerSpirit += 15;
            playerSpiritGain = 15;
            description += '플레이어 기 모으기! ';
        }
        if (aiCard.type === 'SPIRIT') {
            newState.aiSpirit += 15;
            aiSpiritGain = 15;
            description += 'AI 기 모으기! ';
        }

        if (counterForPlayer === aiCard.type) {
            aiDamage = aiCard.damage * (state.aiSpirit > 10 ? 2 : 1);
            if (state.aiSpirit > 10) newState.aiSpirit -= 10;
            description += `AI 역공! `;
        } else if (counterForAI === playerCard.type) {
            playerDamage = playerCard.damage * (state.playerSpirit > 10 ? 2 : 1);
            if (state.playerSpirit > 10) newState.playerSpirit -= 10;
            description += `플레이어 역공! `;
        } else if (playerCard.type === 'ATTACK' && aiCard.type !== 'DEFEND') {
            playerDamage = playerCard.damage;
            description += `플레이어 공격! `;
        } else if (aiCard.type === 'ATTACK' && playerCard.type !== 'DEFEND') {
            aiDamage = aiCard.damage;
            description += `AI 공격! `;
        } else if (playerCard.type === 'DEFEND' || aiCard.type === 'DEFEND') {
            description += '방어! ';
        }

        if (playerCard.type === 'SPECIAL' && aiCard.type !== 'DEFEND') {
            playerDamage = CARD_DAMAGE.SPECIAL * (newState.playerSpirit > 10 ? 2 : 1);
            if (newState.playerSpirit > 10) newState.playerSpirit -= 10;
            description += '필살기! ';
        }
        if (aiCard.type === 'SPECIAL' && playerCard.type !== 'DEFEND') {
            aiDamage = CARD_DAMAGE.SPECIAL * (newState.aiSpirit > 10 ? 2 : 1);
            if (newState.aiSpirit > 10) newState.aiSpirit -= 10;
            description += 'AI 필살기! ';
        }

        newState.playerHp = Math.max(0, newState.playerHp - aiDamage);
        newState.aiHp = Math.max(0, newState.aiHp - playerDamage);

        const result: DuelTurnResult = {
            turn: newState.turn, playerCard, aiCard,
            playerDamage: aiDamage, aiDamage: playerDamage,
            playerSpiritGain, aiSpiritGain, description,
        };
        newState.results = [...newState.results, result];

        if (newState.playerHp <= 0) newState.winner = 'ai';
        else if (newState.aiHp <= 0) newState.winner = 'player';
        else if (newState.turn >= this.MAX_TURNS) {
            newState.winner = newState.playerHp > newState.aiHp ? 'player' : 'ai';
        }

        return newState;
    }
}
