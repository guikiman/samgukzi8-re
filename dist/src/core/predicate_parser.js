/**
 * [3] 조건부 프리디케이트 파서 — PredicateParser
 *
 * 목적: `[Officer.HP > 50, City.Gold >= 5000]` 형태의 JSON/문자열 조건을
 *       불리언 평가식으로 해석하여 이벤트 발동 가능 여부를 판정.
 *
 * 핵심 로직:
 *   1. 연산자(>, <, >=, <=, ===, !==) 파싱
 *   2. 대상 속성(Officer.HP 등)을 실제 게임 상태와 매핑하여 평가
 */
export class PredicateParser {
    /**
     * 조건 리스트 평가 (AND 조건)
     */
    evaluate(conditions, gameState) {
        return conditions.every(cond => this.evaluateCondition(cond, gameState));
    }
    evaluateCondition(cond, state) {
        const actualValue = this.getValueByPath(state, cond.propertyPath);
        switch (cond.operator) {
            case '>': return actualValue > cond.value;
            case '<': return actualValue < cond.value;
            case '>=': return actualValue >= cond.value;
            case '<=': return actualValue <= cond.value;
            case '===': return actualValue === cond.value;
            case '!==': return actualValue !== cond.value;
            default: return false;
        }
    }
    getValueByPath(state, path) {
        return path.split('.').reduce((acc, key) => acc?.[key], state);
    }
}
//# sourceMappingURL=predicate_parser.js.map