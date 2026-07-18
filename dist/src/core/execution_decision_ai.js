/**
 * [65] 협상 거절 및 전사 처형 분기 AI — ExecutionDecisionAI
 *
 * 목적: 포로 처리 결정.
 */
export class ExecutionDecisionAI {
    decide(targetOfficer, rulerPersonality) {
        return rulerPersonality === 'CRUEL' ? 'EXECUTE' : 'RELEASE';
    }
}
//# sourceMappingURL=execution_decision_ai.js.map