/**
 * [C27] 등용/설득 시 설전 연동 — Recruitment Debate System
 *
 * RecruitmentDebateManager:
 *   - attemptRecruit(): 등용 시도
 *   - resolveRecruitment(): 설전 결과에 따른 등용 성공/실패
 *   - 충성도 > 90: 자동 거절
 *   - 충성도 50~90: 설전 모드 진입
 *   - 충성도 < 50: 즉시 등용
 */

import type { OfficerID, FactionID } from './types';

export interface RecruitmentOffer {
    readonly recruiterId: OfficerID;
    readonly targetId: OfficerID;
    readonly factionId: FactionID;
    readonly offerType: 'PERSUADE' | 'INDUCE' | 'FORCE';
    readonly promisedRank: number;
    readonly promisedGold: number;
}

export type RecruitmentPhase = 'IMMEDIATE_SUCCESS' | 'DEBATE_REQUIRED' | 'IMMEDIATE_REFUSAL';

export interface RecruitmentAttempt {
    readonly phase: RecruitmentPhase;
    readonly success: boolean;
    readonly message: string;
    readonly debateRequired: boolean;
}

export class RecruitmentDebateManager {
    private attempts: RecruitmentOffer[] = [];

    /** 등용 시도 */
    attemptRecruit(
        recruiterId: OfficerID,
        targetId: OfficerID,
        targetFactionId: FactionID,
        loyalty: number,
        persuasion: number,
        affection: number,
    ): RecruitmentAttempt {
        this.attempts.push({
            recruiterId, targetId, factionId: targetFactionId,
            offerType: 'PERSUADE', promisedRank: 0, promisedGold: 0,
        });

        // 충성도 기반 분기
        if (loyalty > 90) {
            return {
                phase: 'IMMEDIATE_REFUSAL', success: false,
                message: `${targetId}의 충성도가 너무 높습니다. (${loyalty})`,
                debateRequired: false,
            };
        }

        if (loyalty < 50) {
            // 즉시 등용 성공
            const success = Math.random() < (persuasion / 100) * (affection / 100);
            return {
                phase: 'IMMEDIATE_SUCCESS', success,
                message: success
                    ? `${targetId} 등용 성공!`
                    : `${targetId} 등용 실패.`,
                debateRequired: false,
            };
        }

        // 50~90: 설전 필요
        const debateSuccessChance = (persuasion / 100) * (affection / 100) * ((100 - loyalty) / 100);
        return {
            phase: 'DEBATE_REQUIRED', success: false,
            message: `${targetId}와의 설전이 필요합니다. (성공률: ${Math.floor(debateSuccessChance * 100)}%)`,
            debateRequired: true,
        };
    }

    /** 설전 결과에 따른 등용 해소 */
    resolveRecruitment(
        recruiterId: OfficerID,
        targetId: OfficerID,
        debateWon: boolean,
    ): RecruitmentAttempt {
        if (debateWon) {
            return {
                phase: 'IMMEDIATE_SUCCESS', success: true,
                message: `설전 승리! ${targetId} 등용 성공!`,
                debateRequired: false,
            };
        }

        return {
            phase: 'IMMEDIATE_REFUSAL', success: false,
            message: `설전 패배. ${targetId} 등용 실패. 관계 악화.`,
            debateRequired: false,
        };
    }

    /** 등용 조건 제시 */
    improveOffer(offer: RecruitmentOffer, additionalGold: number, rankIncrease: number): RecruitmentOffer {
        return {
            ...offer,
            promisedGold: offer.promisedGold + additionalGold,
            promisedRank: offer.promisedRank + rankIncrease,
        };
    }

    getAttemptHistory(): RecruitmentOffer[] {
        return [...this.attempts];
    }

    clear(): void {
        this.attempts = [];
    }
}
