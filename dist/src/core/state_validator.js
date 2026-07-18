/**
 * [Task 10] 초기 세팅 유효성 검증기
 *
 * initialize() 시나리오 로딩 단계에서 누락된 정보가 있을 경우
 * 구체적인 에러 위치를 반환하는 스키마 검증기.
 */
export class SchemaValidator {
    validateRequired(obj, requiredFields) {
        const errors = [];
        for (const [field, label] of Object.entries(requiredFields)) {
            const value = obj[field];
            if (value === undefined || value === null) {
                errors.push({ path: field, message: `${label}(이)가 누락되었습니다.` });
            }
            else if (typeof value === "string" && value.trim() === "") {
                errors.push({ path: field, message: `${label}이(가) 비어 있습니다.` });
            }
            else if (Array.isArray(value) && value.length === 0) {
                errors.push({ path: field, message: `${label} 배열이 비어 있습니다.` });
            }
            else if (value instanceof Map && value.size === 0) {
                errors.push({ path: field, message: `${label} Map이 비어 있습니다.` });
            }
        }
        return { valid: errors.length === 0, errors };
    }
    validateNumericRange(obj, ranges) {
        const errors = [];
        for (const [field, config] of Object.entries(ranges)) {
            const value = obj[field];
            if (typeof value !== "number") {
                errors.push({ path: field, message: `${config.label}이(가) 숫자가 아닙니다.` });
                continue;
            }
            if (value < config.min || value > config.max) {
                errors.push({
                    path: field,
                    message: `${config.label}(${value})이(가) 범위(${config.min}~${config.max})를 벗어났습니다.`,
                });
            }
        }
        return { valid: errors.length === 0, errors };
    }
    combine(...results) {
        const allErrors = results.flatMap((r) => r.errors);
        return { valid: allErrors.length === 0, errors: allErrors };
    }
}
//# sourceMappingURL=state_validator.js.map