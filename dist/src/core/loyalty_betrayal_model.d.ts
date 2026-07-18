/**
 * [14] 행위자 기반 모델(ABM) 다차원 충성도/배신 수치 모델
 *
 * AgentBasedLoyaltyModel:
 *   - 야망, 의리, 도덕성, 군주 악명, 봉록, 라이벌 궁합 → 다차원 내적
 *   - FSM 판단 알고리즘: 충성/변절/모반/망명 결정
 */
import type { IGameStore } from './types.js';
export type LoyaltyDecision = 'LOYAL' | 'DEFECT' | 'REBEL' | 'DESERT' | 'ASSASSINATE';
export interface BetrayalFactorWeights {
    readonly ambition: number;
    readonly loyalty: number;
    readonly morality: number;
    readonly lordInfamy: number;
    readonly salaryRatio: number;
    readonly rivalAffinity: number;
}
export interface BetrayalProbability {
    readonly decision: LoyaltyDecision;
    readonly probability: number;
    readonly primaryFactor: string;
    readonly score: number;
}
export declare class AgentBasedLoyaltyModel {
    private store;
    constructor(store: IGameStore);
    /**
     * [14] 배신/모반 확률 계산
     *
     * Score = ambition × 0.3 + (100 - loyalty) × 0.2 + (100 - morality) × 0.15
     *        + lordInfamy × 0.15 + (100 - salaryRatio) × 0.1 + rivalAffinity × 0.1
     *
     * Score ≥ 70 → REBEL (모반)
     * Score 50-69 → DEFECT (배신)
     * Score 30-49 → DESERT (망명)
     * Score < 30 → LOYAL (충성)
     */
    evaluateBetrayal(officerId: string, factionId: string): BetrayalProbability;
    /**
     * [14] 다차원 가중치 연산
     */
    private computeWeights;
    private computeLordInfamy;
    private computeSalaryRatio;
    private computeRivalAffinity;
}
//# sourceMappingURL=loyalty_betrayal_model.d.ts.map