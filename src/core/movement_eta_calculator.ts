/**
 * [8] 동적 병력 이동 및 전장 도달 시간 연산기 — MovementETACalculator
 * 
 * 목적: 이동 시간 계산.
 */
export class MovementETACalculator {
    public calculateETA(distance: number, speed: number): number {
        return Math.floor(distance / speed);
    }
}
