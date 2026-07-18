/**
 * [65] 협상 거절 및 전사 처형 분기 AI — ExecutionDecisionAI
 * 
 * 목적: 포로 처리 결정.
 */
export class ExecutionDecisionAI {
    public decide(targetOfficer: any, rulerPersonality: string): string {
        return rulerPersonality === 'CRUEL' ? 'EXECUTE' : 'RELEASE';
    }
}
