/**
 * [77] 무장 고유 궁합값 매칭 공식 — CompatibilityMatcher
 *
 * 목적: 무장 간 성향 궁합도 산정.
 */
export class CompatibilityMatcher {
    getCompatibility(a, b) {
        return Math.abs(a.personality - b.personality) < 20 ? 80 : 20;
    }
}
//# sourceMappingURL=compatibility_matcher.js.map