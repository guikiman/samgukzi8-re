/**
 * [A10] 세력 연합(반동맹) 시스템 — Alliance League System
 *
 * 특정 거대 세력을 견제하기 위해 다수 세력이 연합
 * AllianceLeagueManager:
 *   - proposeLeague(): 반동맹 제안
 *   - voteOnLeague(): 투표 (과반수 찬성 시 성립)
 *   - dissolveLeague(): 해산
 *   - 연합원 간 상호방어, 연합 타겟에 전쟁 시 자동 참전
 */
import type { FactionID } from './types';
export interface AllianceLeagueState {
    readonly leagueId: string;
    readonly name: string;
    readonly targetFactionId: FactionID;
    readonly memberFactionIds: FactionID[];
    readonly formationDate: number;
    readonly expirationTurn: number;
    readonly votes: Record<FactionID, boolean>;
    readonly isActive: boolean;
    readonly turnsRemaining: number;
}
export type AllianceVote = 'APPROVE' | 'REJECT' | 'ABSTAIN';
export declare class AllianceLeagueManager {
    private leagues;
    private currentTurn;
    setCurrentTurn(turn: number): void;
    /**
     * 반동맹 제안
     * @param initiatorFactionId - 제안 세력
     * @param targetFactionId - 견제 대상 세력
     * @param memberFactionIds - 제안 참여 세력 목록
     */
    proposeLeague(initiatorFactionId: FactionID, targetFactionId: FactionID, memberFactionIds: FactionID[]): AllianceLeagueState;
    /**
     * 연합 투표
     * @param leagueId - 연합 ID
     * @param factionId - 투표 세력
     * @param approve - 찬성 여부
     */
    voteOnLeague(leagueId: string, factionId: FactionID, approve: boolean): boolean;
    /** 연합 해산 */
    dissolveLeague(leagueId: string): boolean;
    /** 연합 멤버 목록 조회 */
    getLeagueMembers(leagueId: string): FactionID[];
    /** 활성 연합 확인 */
    isLeagueActive(leagueId: string): boolean;
    /** 특정 세력이 참여 중인 모든 연합 조회 */
    getLeaguesForFaction(factionId: FactionID): AllianceLeagueState[];
    /** 연합 타겟인 세력 조회 */
    getLeaguesTargetingFaction(factionId: FactionID): AllianceLeagueState[];
    /** 매 턴 호출: 턴 차감 및 만료된 연합 자동 해산 */
    processTurn(): void;
    /** 연합이 상호방어를 제공하는지 확인 */
    isMutualDefenseActive(defenderFactionId: FactionID, attackerFactionId: FactionID): boolean;
    /** 모든 활성 연합 조회 */
    getAllActiveLeagues(): AllianceLeagueState[];
    clear(): void;
}
//# sourceMappingURL=alliance_league_system.d.ts.map