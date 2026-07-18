/**
 * [14] 행위자 기반 모델(ABM) 다차원 충성도/배신 수치 모델
 *
 * AgentBasedLoyaltyModel:
 *   - 야망, 의리, 도덕성, 군주 악명, 봉록, 라이벌 궁합 → 다차원 내적
 *   - FSM 판단 알고리즘: 충성/변절/모반/망명 결정
 */
export class AgentBasedLoyaltyModel {
    constructor(store) {
        this.store = store;
    }
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
    evaluateBetrayal(officerId, factionId) {
        const officer = this.store.getOfficer(officerId);
        const faction = this.store.getFaction(factionId);
        if (!officer || !faction) {
            return { decision: 'LOYAL', probability: 0, primaryFactor: 'N/A', score: 0 };
        }
        const weights = this.computeWeights(officer, faction);
        const score = weights.ambition * 0.3 +
            (100 - weights.loyalty) * 0.2 +
            (100 - weights.morality) * 0.15 +
            weights.lordInfamy * 0.15 +
            (100 - weights.salaryRatio) * 0.1 +
            weights.rivalAffinity * 0.1;
        const clampedScore = Math.max(0, Math.min(100, score));
        let decision;
        let primaryFactor;
        if (clampedScore >= 70) {
            decision = 'REBEL';
            primaryFactor = '야망 과다 + 군주 악명';
        }
        else if (clampedScore >= 50) {
            decision = 'DEFECT';
            primaryFactor = '라이벌 세력 궁합 + 봉록 불만';
        }
        else if (clampedScore >= 30) {
            decision = 'DESERT';
            primaryFactor = '의리 부족 + 도덕성 저하';
        }
        else {
            decision = 'LOYAL';
            primaryFactor = '충성도 + 의리 우세';
        }
        return {
            decision,
            probability: clampedScore / 100,
            primaryFactor,
            score: clampedScore,
        };
    }
    /**
     * [14] 다차원 가중치 연산
     */
    computeWeights(officer, faction) {
        return {
            ambition: officer.ambition,
            loyalty: officer.loyalty,
            morality: officer.morality,
            lordInfamy: this.computeLordInfamy(faction),
            salaryRatio: this.computeSalaryRatio(officer, faction),
            rivalAffinity: this.computeRivalAffinity(officer, faction),
        };
    }
    computeLordInfamy(faction) {
        // 군주 악명 = 세력 평판의 역수 + 전쟁 횟수
        return Math.min(100, Math.max(0, 100 - faction.reputation));
    }
    computeSalaryRatio(officer, faction) {
        // 봉록 지급도 비율
        const idealSalary = officer.salary;
        if (idealSalary <= 0)
            return 100;
        return Math.min(100, Math.max(0, (faction.gold / idealSalary) * 10));
    }
    computeRivalAffinity(officer, faction) {
        // 라이벌 세력과의 궁합 (간소화)
        return 50; // 기본 중립
    }
}
//# sourceMappingURL=loyalty_betrayal_model.js.map