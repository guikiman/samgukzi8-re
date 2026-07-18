/**
 * [B3] 설전 논리 카드 시뮬레이터 — DebateCardEngine
 *
 * 목적: 지력 대결인 설전의 진행을 위한 논리 카드 덱 및 카테고리 매칭 처리.
 *
 * 핵심 로직:
 *   1. 제출된 카드의 속성이 전장 테마(도리론/웅변론/궤변론)와 일치할 경우 위력 1.2배 증폭
 *   2. 지력 차이에 따른 기본 논리 배리어(Logic Shield) 흡수량 수치화
 *   3. REASON > SOPHISTRY > THREAT > REASON 상성
 */
export type DebateCardType = 'REASON' | 'THREAT' | 'SOPHISTRY';
export type DebateTheme = 'REASONING' | 'ELOQUENCE' | 'SOPHISTRY_THEME';
export interface DebateCard {
    readonly type: DebateCardType;
    readonly value: number;
    readonly label: string;
}
export interface DebateState {
    readonly playerLogicHp: number;
    readonly aiLogicHp: number;
    readonly playerMaxLogicHp: number;
    readonly aiMaxLogicHp: number;
    readonly playerLogicShield: number;
    readonly aiLogicShield: number;
    readonly turn: number;
    readonly maxTurns: number;
    readonly playerCards: DebateCard[];
    readonly aiCards: DebateCard[];
    readonly currentTheme: DebateTheme;
    readonly resultLog: DebateTurnResult[];
    readonly winner: 'player' | 'ai' | null;
}
export interface DebateTurnResult {
    readonly turn: number;
    readonly playerCard: DebateCard;
    readonly aiCard: DebateCard;
    readonly playerDamage: number;
    readonly aiDamage: number;
    readonly themeMatch: boolean;
    readonly shieldAbsorbedPlayer: number;
    readonly shieldAbsorbedAi: number;
    readonly description: string;
}
export declare class DebateCardEngine {
    private readonly MAX_TURNS;
    /**
     * 설전 상태 초기화
     *
     * @param playerInt - 플레이어 지력
     * @param aiInt     - AI 지력
     * @param theme     - 설전 테마 (기본값: 랜덤)
     */
    startDebate(playerInt: number, aiInt: number, theme?: DebateTheme): DebateState;
    /**
     * 지력 기반 카드 덱 생성
     */
    private generateCards;
    /**
     * 한 턴 실행
     *
     * @param state          - 현재 설전 상태
     * @param playerCardIndex - 플레이어가 선택한 카드 인덱스
     * @returns 업데이트된 DebateState
     */
    executeTurn(state: DebateState, playerCardIndex: number): DebateState;
    /** AI 카드 선택 (랜덤) */
    selectAICard(state: DebateState): number;
    /** 사용 가능한 카드 목록 반환 */
    getAvailableCards(state: DebateState): DebateCard[];
}
//# sourceMappingURL=debate_card_engine.d.ts.map