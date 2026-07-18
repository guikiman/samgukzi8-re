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
export declare class RecruitmentDebateManager {
    private attempts;
    /** 등용 시도 */
    attemptRecruit(recruiterId: OfficerID, targetId: OfficerID, targetFactionId: FactionID, loyalty: number, persuasion: number, affection: number): RecruitmentAttempt;
    /** 설전 결과에 따른 등용 해소 */
    resolveRecruitment(recruiterId: OfficerID, targetId: OfficerID, debateWon: boolean): RecruitmentAttempt;
    /** 등용 조건 제시 */
    improveOffer(offer: RecruitmentOffer, additionalGold: number, rankIncrease: number): RecruitmentOffer;
    getAttemptHistory(): RecruitmentOffer[];
    clear(): void;
}
//# sourceMappingURL=recruitment_debate_system.d.ts.map