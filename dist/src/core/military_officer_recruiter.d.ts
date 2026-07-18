/**
 * [6] 군사 등용 엔진 — Military Officer Recruiter
 *
 * 재야 장수 탐색 및 등용 시 주군의 명성, 상성 차이, 뇌물 액수에 따른
 * 설득 성공 여부를 계산하는 등용 엔진
 */
import type { OfficerID, FactionID } from './types.js';
export interface RecruitResult {
    success: boolean;
    message: string;
}
export interface OfficerRelationData {
    factionId: FactionID | null;
    loyalty: number;
    name: string;
    items: string[];
}
export declare class MilitaryOfficerRecruiter {
    private officers;
    setOfficerData(id: OfficerID, data: OfficerRelationData): void;
    getOfficerData(id: OfficerID): OfficerRelationData | null;
    /**
     * 등용 시도
     *
     * 공식: 등용확률 = 50 - (target충성도 / 2)
     * - 같은 세력 소속이면 실패
     * - 성공 시 충성도 = loyaltyBonus, 신분 = 일반
     */
    recruit(recruiterId: OfficerID, targetId: OfficerID, recruiterFaction: FactionID, loyaltyBonus?: number): RecruitResult;
    /**
     * 포상 — 금액에 비례한 충성도 상승
     */
    reward(officerId: OfficerID, goldAmount: number): RecruitResult;
    /**
     * 몰수 — 대상 무장의 아이템을 몰수하고 충성도 30 감소
     */
    confiscate(rulerId: OfficerID, targetId: OfficerID): RecruitResult & {
        confiscatedCount?: number;
    };
    /**
     * 해고 — 무장을 세력에서 방출
     */
    dismiss(rulerId: OfficerID, targetId: OfficerID): RecruitResult;
    /**
     * 임명 — 무장의 직책 변경
     */
    appoint(officerId: OfficerID, rank: string): RecruitResult;
    /**
     * 등용 확률 계산 (실행 전 예측)
     */
    predictRecruitChance(targetId: OfficerID, recruiterFaction: FactionID): number;
    getAllOfficers(): OfficerID[];
    reset(): void;
}
//# sourceMappingURL=military_officer_recruiter.d.ts.map