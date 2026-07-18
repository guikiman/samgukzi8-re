/**
 * [E38] 유저 모드 파일 유효성 검사기 — JSONSchemaModValidator
 *
 * 목적: 유저 제작 커스텀 무장/시나리오 JSON 파일 업로드 시
 *       잘못된 속성값으로 인한 런타임 오류 차단.
 *
 * 핵심 로직:
 *   1. JSON Schema 기반 타입/범위/참조 ID 검증
 *   2. 존재하지 않는 무장 ID 참조 시 경고 + 로더 배제
 */
export type SchemaFieldType = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'officer_ref' | 'city_ref';
export type ValidationSeverity = 'ERROR' | 'WARNING';
export interface SchemaField {
    readonly name: string;
    readonly type: SchemaFieldType;
    readonly required: boolean;
    readonly min?: number;
    readonly max?: number;
    readonly minLength?: number;
    readonly maxLength?: number;
    readonly enum?: string[];
    readonly items?: SchemaField;
    readonly properties?: SchemaField[];
}
export interface ValidationError {
    readonly path: string;
    readonly field: string;
    readonly severity: ValidationSeverity;
    readonly message: string;
    readonly code: string;
}
export interface ValidationResult {
    readonly valid: boolean;
    readonly errors: ValidationError[];
    readonly warnings: ValidationError[];
}
export declare class JSONSchemaModValidator {
    private validOfficerIds;
    private validCityIds;
    /** 유효한 참조 ID 등록 */
    registerReferenceIds(officerIds: string[], cityIds: string[]): void;
    /**
     * JSON 데이터 검증
     *
     * @param data      - 검증할 JSON 객체
     * @param schema    - 적용할 스키마
     * @param basePath  - 오류 경로 접두사
     */
    validate(data: Record<string, unknown>, schema?: SchemaField[], basePath?: string): ValidationResult;
    /**
     * 모드 데이터 로더 허용 여부 (에러가 하나라도 있으면 거부)
     */
    canLoad(result: ValidationResult): boolean;
}
//# sourceMappingURL=json_schema_mod_validator.d.ts.map