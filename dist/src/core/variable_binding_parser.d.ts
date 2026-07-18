/**
 * [28] 이벤트 변수 바인딩 파서 — VariableBindingParser
 *
 * VariableBindingParser:
 *   1. 대사 내의 $[TargetOfficer], $[SourceCity] 등의 플레이스홀더를
 *      실제 인메모리 객체의 이름 및 속성으로 치환
 *   2. 중첩된 객체 경로 탐색 지원 (Officer.faction.leader.name)
 *   3. 타입 안전한 바인딩 컨텍스트 제공
 */
export type BindingValue = string | number | boolean | null;
export interface BindingContext {
    readonly [key: string]: BindingValue | BindingContext | (() => BindingValue);
}
export declare class VariableBindingParser {
    private bindings;
    registerContext(name: string, context: BindingContext): void;
    unregisterContext(name: string): void;
    resolve(raw: string): string;
    resolveBatch(strings: string[]): string[];
    private resolvePath;
    getRegisteredContexts(): string[];
    clear(): void;
}
//# sourceMappingURL=variable_binding_parser.d.ts.map