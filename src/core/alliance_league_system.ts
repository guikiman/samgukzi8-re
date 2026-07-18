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

export class AllianceLeagueManager {
    private leagues: Map<string, AllianceLeagueState> = new Map();
    private currentTurn: number = 0;

    setCurrentTurn(turn: number): void {
        this.currentTurn = turn;
    }

    /**
     * 반동맹 제안
     * @param initiatorFactionId - 제안 세력
     * @param targetFactionId - 견제 대상 세력
     * @param memberFactionIds - 제안 참여 세력 목록
     */
    proposeLeague(
        initiatorFactionId: FactionID,
        targetFactionId: FactionID,
        memberFactionIds: FactionID[],
    ): AllianceLeagueState {
        const leagueId = `league_${targetFactionId}_${Date.now()}`;
        const allMembers = [initiatorFactionId, ...memberFactionIds.filter(f => f !== initiatorFactionId)];

        // 초기 투표: 제안자는 찬성
        const votes: Record<FactionID, boolean> = {};
        votes[initiatorFactionId] = true;
        for (const member of memberFactionIds) {
            if (!votes[member]) votes[member] = false;
        }

        const league: AllianceLeagueState = {
            leagueId,
            name: `${targetFactionId} 견제 연합`,
            targetFactionId,
            memberFactionIds: allMembers,
            formationDate: Date.now(),
            expirationTurn: this.currentTurn + 36, // 3년 후 자동 해산
            votes,
            isActive: false,
            turnsRemaining: 36,
        };

        this.leagues.set(leagueId, league);
        return league;
    }

    /**
     * 연합 투표
     * @param leagueId - 연합 ID
     * @param factionId - 투표 세력
     * @param approve - 찬성 여부
     */
    voteOnLeague(leagueId: string, factionId: FactionID, approve: boolean): boolean {
        const league = this.leagues.get(leagueId);
        if (!league) return false;
        if (!league.memberFactionIds.includes(factionId)) return false;

        const updatedVotes = { ...league.votes, [factionId]: approve };

        // 과반수 찬성 시 연합 성립
        const totalMembers = league.memberFactionIds.length;
        const approveCount = Object.values(updatedVotes).filter(v => v).length;
        const isActive = approveCount > totalMembers / 2;

        this.leagues.set(leagueId, { ...league, votes: updatedVotes, isActive });
        return true;
    }

    /** 연합 해산 */
    dissolveLeague(leagueId: string): boolean {
        const league = this.leagues.get(leagueId);
        if (!league) return false;
        this.leagues.set(leagueId, { ...league, isActive: false });
        return true;
    }

    /** 연합 멤버 목록 조회 */
    getLeagueMembers(leagueId: string): FactionID[] {
        const league = this.leagues.get(leagueId);
        return league ? [...league.memberFactionIds] : [];
    }

    /** 활성 연합 확인 */
    isLeagueActive(leagueId: string): boolean {
        const league = this.leagues.get(leagueId);
        return league?.isActive ?? false;
    }

    /** 특정 세력이 참여 중인 모든 연합 조회 */
    getLeaguesForFaction(factionId: FactionID): AllianceLeagueState[] {
        return Array.from(this.leagues.values()).filter(
            l => l.isActive && l.memberFactionIds.includes(factionId),
        );
    }

    /** 연합 타겟인 세력 조회 */
    getLeaguesTargetingFaction(factionId: FactionID): AllianceLeagueState[] {
        return Array.from(this.leagues.values()).filter(
            l => l.isActive && l.targetFactionId === factionId,
        );
    }

    /** 매 턴 호출: 턴 차감 및 만료된 연합 자동 해산 */
    processTurn(): void {
        this.currentTurn++;
        for (const [leagueId, league] of this.leagues) {
            if (!league.isActive) continue;
            const remaining = league.expirationTurn - this.currentTurn;
            this.leagues.set(leagueId, { ...league, turnsRemaining: remaining });
            if (remaining <= 0) {
                this.leagues.set(leagueId, { ...league, isActive: false, turnsRemaining: 0 });
            }
        }
    }

    /** 연합이 상호방어를 제공하는지 확인 */
    isMutualDefenseActive(defenderFactionId: FactionID, attackerFactionId: FactionID): boolean {
        for (const league of this.leagues.values()) {
            if (!league.isActive) continue;
            if (league.targetFactionId !== attackerFactionId) continue;
            if (league.memberFactionIds.includes(defenderFactionId)) return true;
        }
        return false;
    }

    /** 모든 활성 연합 조회 */
    getAllActiveLeagues(): AllianceLeagueState[] {
        return Array.from(this.leagues.values()).filter(l => l.isActive);
    }

    clear(): void {
        this.leagues.clear();
    }
}
