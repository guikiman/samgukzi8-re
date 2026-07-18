/**
 * [28] 이벤트 변수 바인딩 파서 — VariableBindingParser
 *
 * VariableBindingParser:
 *   1. 대사 내의 $[TargetOfficer], $[SourceCity] 등의 플레이스홀더를
 *      실제 인메모리 객체의 이름 및 속성으로 치환
 *   2. 중첩된 객체 경로 탐색 지원 (Officer.faction.leader.name)
 *   3. 타입 안전한 바인딩 컨텍스트 제공
 */
const PLACEHOLDER_PATTERN = /\$\[([\w.]+)\]/g;
const NESTED_PATH_PATTERN = /\./;
export class VariableBindingParser {
    constructor() {
        this.bindings = new Map();
    }
    registerContext(name, context) {
        this.bindings.set(name, context);
    }
    unregisterContext(name) {
        this.bindings.delete(name);
    }
    resolve(raw) {
        return raw.replace(PLACEHOLDER_PATTERN, (_match, path) => {
            const resolved = this.resolvePath(path);
            if (resolved === null)
                return `[UNRESOLVED:${path}]`;
            return String(resolved);
        });
    }
    resolveBatch(strings) {
        return strings.map(s => this.resolve(s));
    }
    resolvePath(path) {
        const segments = path.split(NESTED_PATH_PATTERN);
        if (segments.length === 0)
            return null;
        const rootName = segments[0];
        const root = this.bindings.get(rootName);
        if (!root)
            return null;
        let current = root;
        for (let i = 1; i < segments.length; i++) {
            const key = segments[i];
            if (current === null || typeof current !== 'object')
                return null;
            const value = current[key];
            if (value === undefined)
                return null;
            if (typeof value === 'function') {
                current = value();
            }
            else {
                current = value;
            }
        }
        if (typeof current === 'string' || typeof current === 'number' || typeof current === 'boolean' || current === null) {
            return current;
        }
        return String(current);
    }
    getRegisteredContexts() {
        return Array.from(this.bindings.keys());
    }
    clear() {
        this.bindings.clear();
    }
}
//# sourceMappingURL=variable_binding_parser.js.map