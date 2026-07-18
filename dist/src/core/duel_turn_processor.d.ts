/**
 * [B2] 일기토 턴제 판정 엔진 — DuelTurnProcessor
 *
 * 목적: 5턴 동안 유저와 AI가 비공개로 선택한 카드를 동시 공개하여
 *       상성 및 데미지를 계산하고 투기 게이지를 누적.
 *
 * 핵심 로직:
 *   1. CRITICAL > ATTACK > DEFENSE > CRITICAL 가위바위보 상성
 *   2. FOCUS(FOCUS) 카드 활성화 시 다음 공격 데미지 1.5배 보정
 *   3. 5턴 종료 or HP 0시 승패 판정
 */
import type { DuelCard } from './duel_deck_builder';
export interface DuelState {
    readonly playerHp: number;
    readonly aiHp: number;
    readonly playerSpirit: number;
    readonly aiSpirit: number;
    readonly turn: number;
    readonly maxTurns: number;
    readonly playerFocusBoost: boolean;
    readonly aiFocusBoost: boolean;
    readonly results: DuelTurnResult[];
    readonly winner: 'player' | 'ai' | null;
    readonly playerId: string;
    readonly aiId: string;
}
export interface DuelTurnResult {
    readonly turn: number;
    readonly playerCard: DuelCard;
    readonly aiCard: DuelCard;
    readonly playerDamageDealt: number;
    readonly aiDamageDealt: number;
    readonly playerSpiritDelta: number;
    readonly aiSpiritDelta: number;
    readonly description: string;
}
export declare class DuelTurnProcessor {
    private readonly MAX_TURNS;
    /**
     * 일기토 초기 상태 생성
     */
    startDuel(playerId: string, playerMight: number, aiId: string, aiMight: number): DuelState;
    /**
     * 한 턴 처리: 플레이어 카드 + AI 카드 동시 공개 → 상성 판정 → 데미지 적용
     *
     * @param state      - 현재 듀얼 상태
     * @param playerCard - 플레이어가 선택한 카드
     * @param aiCard     - AI가 선택한 카드
     * @returns 업데이트된 DuelState
     */
    processTurn(state: DuelState, playerCard: DuelCard, aiCard: DuelCard): DuelState;
    /** AI 카드 선택 (무력 기반 가중치 랜덤) */
    selectAICard(state: DuelState, aiMight: number): DuelCard;
}
//# sourceMappingURL=duel_turn_processor.d.ts.map