/**
 * 무장 등용/배신 시스템 [24] [C-인간관계]
 *
 * 등용(Recruitment):
 * - 재야(FREE) 무장 또는 타세력 무장을 초빙
 * - 성공률 = 정치력 + 카리스마 vs 대상 충성도/야망
 * - 성공 시 플레이어(또는 실행 세력) 소속으로 편입, 도시로 배치
 *
 * 배신(Defection):
 * - 월간 정산 시 충성도가 임계 이하인 무장은 확률적으로 이탈
 * - 야망이 높을수록 이탈 확률 증가
 * - 이탈 시 재야화 (또는 인접 적 세력으로 투쟁 — 간단화: 재야)
 */
import type { GameStore } from './game_store.js';
export interface RecruitmentResult {
    success: boolean;
    message: string;
}
export interface DefectionReport {
    officerId: string;
    officerName: string;
    fromFactionId: string | null;
    reason: 'LOYALTY_LOW' | 'AMBITION_HIGH';
}
export declare class OfficerLoyaltySystem {
    private store;
    constructor(store: GameStore);
    /**
     * 등용 성공률 미리보기 [24] — UI 표시용 (실제 등용 로직과 동일 수식)
     * @param officerId 등용 대상 무장 ID
     * @param recruiterId 초빙 실행 무장 ID (생략 시 기본 능력 60 가정)
     */
    getRecruitChance(officerId: string, recruiterId?: string): number;
    /**
     * 무장 등용 시도
     * @param officerId 등용할 무장 ID
     * @param targetFactionId 편입시킬 세력 ID
     * @param cityId 배치할 도시 ID
     * @param recruiterId 초빙 실행 무장 ID (능력치에 반영)
     */
    recruit(officerId: string, targetFactionId: string, cityId: string, recruiterId?: string): RecruitmentResult;
    /** 월간 배신 판정 — 충성도 낮은 무장 이탈 */
    processMonthlyDefections(): DefectionReport[];
}
//# sourceMappingURL=officer_loyalty_system.d.ts.map