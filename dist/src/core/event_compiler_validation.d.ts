/**
 * [11] 연의전 StoryEventCompiler 완벽 유효성 검증 스키마
 *
 * EventSchemaValidator:
 *   - AJV 스타일 JSON-Schema 정밀 검증
 *   - 참조 무결성 검사: 무장 ID, 도시 ID, faction ID 존재 여부
 *   - 조건 데드락 감지 (event_dag.ts 연계)
 *   - 속성 타입/범위/필수값 일괄 검증
 */
import { EventDAGParser } from './event_dag.js';
import type { IGameStore } from './types.js';
export interface ValidationError {
    readonly path: string;
    readonly message: string;
    readonly severity: 'ERROR' | 'WARNING';
    readonly code: string;
}
export interface ValidationResult {
    readonly valid: boolean;
    readonly errors: readonly ValidationError[];
    readonly warnings: readonly ValidationError[];
    readonly dagResult: ReturnType<EventDAGParser['validateDAG']> | null;
}
export interface EventStorySchema {
    readonly $schema?: string;
    readonly type: 'object';
    readonly properties: Record<string, unknown>;
    readonly required: readonly string[];
    readonly additionalProperties?: boolean;
}
export declare class EventSchemaValidator {
    private store;
    private dagParser;
    private eventSchema;
    constructor(store: IGameStore);
    /**
     * [11] 이벤트 JSON 스키마 정의
     * AJV 호환 형식
     */
    private buildSchema;
    /**
     * [11] 이벤트 데이터 정적 검증
     * 테스트할 이벤트 데이터를 로드하여 1ms 이내 검증
     */
    validate(eventData: Record<string, unknown>): ValidationResult;
    /**
     * [11] 스키마 속성 검증
     */
    private validateSchema;
    /**
     * [11] 참조 무결성 검증
     * officerId, cityId, factionId 존재 여부 확인
     */
    private validateReferences;
}
//# sourceMappingURL=event_compiler_validation.d.ts.map