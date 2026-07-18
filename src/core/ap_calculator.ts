/**
 * [10] 행동력 동적 계산기 — APCalculator
 * 
 * 목적: 행동력 계산.
 */
export class APCalculator {
    public calculateAP(intelligence: number, loyalty: number): number {
        return Math.floor(intelligence * 0.1 + loyalty * 0.05);
    }
}
