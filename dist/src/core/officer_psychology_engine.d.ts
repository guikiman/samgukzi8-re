/**
 * [8] 무장 심리 엔진 — Officer Psychology Engine
 *
 * [381] 번아웃 (우울증)
 * [382] 편집증(의심병)
 * [389] 트라우마 관리
 *
 * AI 무장의 번아웃, 편집증, 충성도 변동 및 사직서 제출 확률을
 * 매달 계산하여 상태를 변이시키는 자아 FSM 엔진
 */
import type { OfficerID } from './types.js';
export interface PsychologyState {
    officerId: OfficerID;
    burnout: number;
    paranoia: number;
    hasTrauma: boolean;
    loyaltyDelta: number;
    willResign: boolean;
    willDefect: boolean;
}
export declare class OfficerPsychologyEngine {
    private burnout;
    private paranoia;
    private trauma;
    private resignationHistory;
    private defectHistory;
    private static readonly BURNOUT_THRESHOLD;
    private static readonly PARANOIA_THRESHOLD;
    /**
     * 번아웃 증가
     */
    addBurnout(officerId: OfficerID, amount: number): void;
    getBurnout(officerId: OfficerID): number;
    /**
     * 편집증 발동
     */
    triggerParanoia(officerId: OfficerID, amount?: number): void;
    getParanoia(officerId: OfficerID): number;
    /**
     * 트라우마 부여
     */
    addTrauma(officerId: OfficerID): void;
    hasTrauma(officerId: OfficerID): boolean;
    /**
     * 매월 심리 상태 업데이트
     *
     * - 번아웃 ≥ 80 → 사직서 제출 확률 30%
     * - 편집증 ≥ 70 → 배신 확률 25%
     * - 트라우마 보유 시 모든 확률 1.5배
     */
    processMonthlyUpdate(officerId: OfficerID, baseLoyalty: number, workload: number): PsychologyState;
    /**
     * 심리 상태 초기화
     */
    resetOfficer(officerId: OfficerID): void;
    getResignationHistory(): OfficerID[];
    getDefectHistory(): OfficerID[];
    reset(): void;
}
//# sourceMappingURL=officer_psychology_engine.d.ts.map