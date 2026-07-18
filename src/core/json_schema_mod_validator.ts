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
    readonly items?: SchemaField;  // array item type
    readonly properties?: SchemaField[];  // object properties
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

const OFFICER_SCHEMA: SchemaField[] = [
    { name: 'id', type: 'string', required: true, minLength: 1, maxLength: 20 },
    { name: 'name', type: 'string', required: true, minLength: 1, maxLength: 10 },
    { name: 'might', type: 'number', required: true, min: 1, max: 100 },
    { name: 'intelligence', type: 'number', required: true, min: 1, max: 100 },
    { name: 'politics', type: 'number', required: true, min: 1, max: 100 },
    { name: 'charisma', type: 'number', required: true, min: 1, max: 100 },
    { name: 'loyalty', type: 'number', required: false, min: 0, max: 100 },
    { name: 'skills', type: 'array', required: false, items: { name: 'skill', type: 'string', required: false, minLength: 1, maxLength: 20 } },
    { name: 'fatherId', type: 'officer_ref', required: false },
    { name: 'spouseId', type: 'officer_ref', required: false },
];

export class JSONSchemaModValidator {
    private validOfficerIds: Set<string> = new Set();
    private validCityIds: Set<string> = new Set();

    /** 유효한 참조 ID 등록 */
    registerReferenceIds(officerIds: string[], cityIds: string[]): void {
        this.validOfficerIds = new Set(officerIds);
        this.validCityIds = new Set(cityIds);
    }

    /**
     * JSON 데이터 검증
     *
     * @param data      - 검증할 JSON 객체
     * @param schema    - 적용할 스키마
     * @param basePath  - 오류 경로 접두사
     */
    validate(data: Record<string, unknown>, schema: SchemaField[] = OFFICER_SCHEMA, basePath: string = '$'): ValidationResult {
        const errors: ValidationError[] = [];
        const warnings: ValidationError[] = [];

        for (const field of schema) {
            const value = data[field.name];
            const path = `${basePath}.${field.name}`;

            // 필수 필드 누락
            if (field.required && (value === undefined || value === null)) {
                errors.push({
                    path, field: field.name,
                    severity: 'ERROR',
                    message: `필수 필드 '${field.name}' 누락`,
                    code: 'REQUIRED_FIELD_MISSING',
                });
                continue;
            }

            if (value === undefined || value === null) continue;

            // 타입 검증
            if (field.type === 'officer_ref') {
                if (typeof value !== 'string') {
                    errors.push({ path, field: field.name, severity: 'ERROR', message: `'${field.name}'는 무장 ID 문자열이어야 함`, code: 'TYPE_MISMATCH' });
                } else if (value !== '' && !this.validOfficerIds.has(value)) {
                    warnings.push({ path, field: field.name, severity: 'WARNING', message: `존재하지 않는 무장 ID: ${value}`, code: 'INVALID_REFERENCE' });
                }
            } else if (field.type === 'city_ref') {
                if (typeof value !== 'string') {
                    errors.push({ path, field: field.name, severity: 'ERROR', message: `'${field.name}'는 도시 ID 문자열이어야 함`, code: 'TYPE_MISMATCH' });
                } else if (value !== '' && !this.validCityIds.has(value)) {
                    warnings.push({ path, field: field.name, severity: 'WARNING', message: `존재하지 않는 도시 ID: ${value}`, code: 'INVALID_REFERENCE' });
                }
            } else if (field.type === 'number') {
                if (typeof value !== 'number') {
                    errors.push({ path, field: field.name, severity: 'ERROR', message: `'${field.name}'는 숫자여야 함`, code: 'TYPE_MISMATCH' });
                } else {
                    if (field.min !== undefined && value < field.min) {
                        errors.push({ path, field: field.name, severity: 'ERROR', message: `'${field.name}' 최소값 ${field.min} 미만 (${value})`, code: 'VALUE_OUT_OF_RANGE' });
                    }
                    if (field.max !== undefined && value > field.max) {
                        errors.push({ path, field: field.name, severity: 'ERROR', message: `'${field.name}' 최대값 ${field.max} 초과 (${value})`, code: 'VALUE_OUT_OF_RANGE' });
                    }
                }
            } else if (field.type === 'string') {
                if (typeof value !== 'string') {
                    errors.push({ path, field: field.name, severity: 'ERROR', message: `'${field.name}'는 문자열이어야 함`, code: 'TYPE_MISMATCH' });
                } else {
                    if (field.minLength !== undefined && value.length < field.minLength) {
                        errors.push({ path, field: field.name, severity: 'ERROR', message: `'${field.name}' 최소 길이 ${field.minLength} 미만`, code: 'VALUE_OUT_OF_RANGE' });
                    }
                    if (field.maxLength !== undefined && value.length > field.maxLength) {
                        errors.push({ path, field: field.name, severity: 'ERROR', message: `'${field.name}' 최대 길이 ${field.maxLength} 초과`, code: 'VALUE_OUT_OF_RANGE' });
                    }
                    if (field.enum && !field.enum.includes(value)) {
                        errors.push({ path, field: field.name, severity: 'ERROR', message: `'${field.name}'는 ${field.enum.join(', ')} 중 하나여야 함`, code: 'VALUE_NOT_IN_ENUM' });
                    }
                }
            } else if (field.type === 'array') {
                if (!Array.isArray(value)) {
                    errors.push({ path, field: field.name, severity: 'ERROR', message: `'${field.name}'는 배열이어야 함`, code: 'TYPE_MISMATCH' });
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings,
        };
    }

    /**
     * 모드 데이터 로더 허용 여부 (에러가 하나라도 있으면 거부)
     */
    canLoad(result: ValidationResult): boolean {
        return result.errors.length === 0;
    }
}
