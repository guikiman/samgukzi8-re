/**
 * [80] 호감도 동적 증감 공식 — AffectionFormula
 * 
 * 목적: 우호도 변동 연산.
 */
export class AffectionFormula {
    public calculateAffectionChange(event: string): number {
        return event === 'GIFT' ? 10 : 0;
    }
}
