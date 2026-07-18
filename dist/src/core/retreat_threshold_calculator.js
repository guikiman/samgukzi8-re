/**
 * [58] 전장 퇴각 판단 마진 계산기 — RetreatThresholdCalculator
 *
 * 목적: 전황 분석 후 퇴각 결정.
 */
export class RetreatThresholdCalculator {
    shouldRetreat(unit) {
        return unit.hp < (unit.maxHp * 0.2);
    }
}
//# sourceMappingURL=retreat_threshold_calculator.js.map