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
export declare class DuelDeckBuilder {
    buildDeck(officerId: string, might: number, skills: string[]): DuelDeck;
    drawCard(deck: DuelDeck): DuelCard | null;
}
export declare class DuelTurnProcessor {
    private readonly MAX_TURNS;
    startDuel(playerId: string, playerMight: number, aiId: string, aiMight: number, playerSkills: string[], aiSkills: string[]): DuelBattleState;
    processTurn(state: DuelBattleState, playerDeck: DuelDeck, aiDeck: DuelDeck): DuelBattleState;
}
//# sourceMappingURL=duel_deck_engine.d.ts.map