/**
 * [55] 외교적 배신 가중치 필터 — DiplomaticBetrayalFilter
 * 
 * 목적: 동맹 파기 및 급습 결정.
 */
export class DiplomaticBetrayalFilter {
    public shouldBetray(faction: any, target: any): boolean {
        return Math.random() < 0.2;
    }
}
