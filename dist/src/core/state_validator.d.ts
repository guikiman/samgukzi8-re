/**
 * [Task 10] 초기 세팅 유효성 검증기
 *
 * initialize() 시나리오 로딩 단계에서 누락된 정보가 있을 경우
 * 구체적인 에러 위치를 반환하는 스키마 검증기.
 */
export interface ValidationError {
    readonly path: string;
    readonly message: string;
}
export interface ValidationResult {
    readonly valid: boolean;
    readonly errors: ValidationError[];
}
export declare class SchemaValidator {
    validateRequired(obj: Record<string, unknown>, requiredFields: Record<string, string>): ValidationResult;
    validateNumericRange(obj: Record<string, unknown>, ranges: Record<string, {
        min: number;
        max: number;
        label: string;
    }>): ValidationResult;
    combine(...results: ValidationResult[]): ValidationResult;
}
//# sourceMappingURL=state_validator.d.ts.map