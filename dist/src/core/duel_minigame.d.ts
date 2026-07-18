/**
 * [B11] 일기토(Duel) 미니게임 엔진
 *
 * 삼국지 8 리메이크 스타일 5턴제 일기토
 * 카드 대결: ATTACK > DEFENSE, DEFENSE > COUNTER, COUNTER > ATTACK
 * SPIRIT 시스템: 매 턴 +1 (최대 5), SPECIAL 카드 소모
 */
import type { OfficerID, OfficerStats } from './types';
export type DuelCardType = 'SLASH' | 'GUARD' | 'POWER_STRIKE' | 'COUNTER' | 'HEAL' | 'FURY';
export interface DuelCard {
    readonly type: DuelCardType;
    readonly power: number;
    readonly spiritCost: number;
    readonly label: string;
    readonly description: string;
}
export interface DuelState {
    readonly turn: number;
    readonly playerId: OfficerID;
    readonly enemyId: OfficerID;
    readonly playerHp: number;
    readonly enemyHp: number;
    readonly playerSpirit: number;
    readonly enemySpirit: number;
    readonly playerMaxHp: number;
    readonly enemyMaxHp: number;
    readonly phase: 'READY' | 'PLAYER_TURN' | 'ENEMY_TURN' | 'RESOLVE' | 'DONE';
    readonly log: string[];
    readonly winner: OfficerID | null;
    readonly maxTurns: number;
}
export declare class DuelMinigame {
    private state;
    constructor();
    private createInitialState;
    /** 일기토 시작 */
    startDuel(playerId: OfficerID, enemyId: OfficerID, playerStats: OfficerStats, enemyStats: OfficerStats): DuelState;
    /** 사용 가능한 카드 목록 반환 */
    getAvailableCards(spirit: number): DuelCard[];
    /** 적 AI 카드 선택 (랜덤) */
    private enemyChooseCard;
    /** 카드 대결 해소 */
    private resolveCards;
    /** 플레이어 카드 선택 후 턴 실행 */
    playCard(playerCardType: DuelCardType): DuelState;
    /** 일기토 종료 여부 */
    isDuelOver(): boolean;
    /** 현재 상태 반환 */
    getState(): DuelState;
    /** 승자 반환 */
    getWinner(): OfficerID | null;
}
//# sourceMappingURL=duel_minigame.d.ts.map