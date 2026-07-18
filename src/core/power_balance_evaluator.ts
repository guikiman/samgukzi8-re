/**
 * [52] 세력 균형 평가 모듈 — PowerBalanceEvaluator
 * 
 * 목적: 인접 세력과의 힘의 균형 평가.
 */
export class PowerBalanceEvaluator {
    public evaluate(myPower: number, enemyPower: number): 'STRONG' | 'WEAK' {
        return myPower > enemyPower ? 'STRONG' : 'WEAK';
    }
}
