/**
 * [55] 외교적 배신 가중치 필터 — DiplomaticBetrayalFilter
 *
 * 목적: 동맹 파기 및 급습 결정.
 */
export class DiplomaticBetrayalFilter {
    shouldBetray(faction, target) {
        return Math.random() < 0.2;
    }
}
//# sourceMappingURL=diplomatic_betrayal_filter.js.map