/**
 * [B12] 설전(Debate) 미니게임 엔진
 *
 * 삼국지 8 리메이크 스타일 설전 시스템
 * INT/WIT/PRESSURE 속성 카드 대결
 * LOGIC > FALLACY, WIT > LOGIC, PRESSURE > WIT, FALLACY > PRESSURE
 * MOOD 시스템: 연속 승리 시 보정
 */
import type { OfficerID, OfficerStats } from './types';
export type DebateCardType = 'LOGIC' | 'WIT' | 'PRESSURE' | 'RHETORIC' | 'FALLACY' | 'WISDOM';
export interface DebateCard {
    readonly type: DebateCardType;
    readonly power: number;
    readonly spiritCost: number;
    readonly label: string;
    readonly description: string;
}
export interface DebateState {
    readonly turn: number;
    readonly playerId: OfficerID;
    readonly enemyId: OfficerID;
    readonly playerMood: number;
    readonly enemyMood: number;
    readonly playerSpirit: number;
    readonly enemySpirit: number;
    readonly playerScore: number;
    readonly enemyScore: number;
    readonly phase: 'READY' | 'PLAYER_TURN' | 'RESOLVE' | 'DONE';
    readonly log: string[];
    readonly winner: OfficerID | null;
    readonly maxTurns: number;
    readonly topic: string;
}
export declare class DebateMinigame {
    private state;
    constructor();
    private createInitialState;
    /** 설전 시작 */
    startDebate(playerId: OfficerID, enemyId: OfficerID, playerStats: OfficerStats, enemyStats: OfficerStats, topic?: string): DebateState;
    /** 사용 가능한 카드 목록 */
    getAvailableCards(spirit: number, _mood?: number): DebateCard[];
    /** 적 카드 선택 (AI) */
    private enemyChooseCard;
    /** 카드 대결 해소 */
    private resolveDebate;
    /** 플레이어 카드 선택 후 턴 진행 */
    playCard(playerCardType: DebateCardType): DebateState;
    /** 설전 종료 여부 */
    isDebateOver(): boolean;
    /** 현재 상태 반환 */
    getState(): DebateState;
    /** 승자 반환 */
    getWinner(): OfficerID | null;
    /** 설전 결과 요약 */
    getDebateResult(): {
        winner: OfficerID | null;
        loser: OfficerID | null;
        scoreRemaining: number;
        turnsUsed: number;
    };
}
//# sourceMappingURL=debate_minigame.d.ts.map