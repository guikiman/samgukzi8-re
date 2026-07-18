/**
 * [E47] 모드 JSON 스키마 유효성 검사기 — Mod Schema Validator
 *
 * ModSchemaValidator:
 *   1. 무장 데이터 JSON 검증 (OfficerSchema)
 *   2. 이벤트 시나리오 JSON 검증 (EventSchema)
 *   3. 도시/아이템 JSON 검증
 *   4. 누락 필드, 타입 불일치, 참조 무결성 검사
 *   5. 상세 오류 메시지 반환
 */
export interface ValidationError {
    readonly path: string;
    readonly field: string;
    readonly message: string;
}
export interface ValidationResult {
    readonly valid: boolean;
    readonly errors: ValidationError[];
}
export declare class ModSchemaValidator {
    validateOfficer(data: any): ValidationResult;
    validateEvent(data: any): ValidationResult;
    validateCity(data: any): ValidationResult;
    validateItem(data: any): ValidationResult;
    validateModPackage(data: any): ValidationResult;
}
//# sourceMappingURL=mod_schema_validator.d.ts.map