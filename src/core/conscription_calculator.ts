/**
 * [30] 병역 인구 및 모병 공식기 — ConscriptionCalculator
 * 
 * 목적: 모병 가능 인구 계산.
 */
export class ConscriptionCalculator {
    public calculateMaxConscription(population: number): number {
        return Math.floor(population * 0.05);
    }
}
