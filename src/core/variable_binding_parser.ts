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

const PLACEHOLDER_PATTERN = /\$\[([\w.]+)\]/g;
const NESTED_PATH_PATTERN = /\./;

export class VariableBindingParser {
    private bindings: Map<string, BindingContext> = new Map();

    registerContext(name: string, context: BindingContext): void {
        this.bindings.set(name, context);
    }

    unregisterContext(name: string): void {
        this.bindings.delete(name);
    }

    resolve(raw: string): string {
        return raw.replace(PLACEHOLDER_PATTERN, (_match, path: string) => {
            const resolved = this.resolvePath(path);
            if (resolved === null) return `[UNRESOLVED:${path}]`;
            return String(resolved);
        });
    }

    resolveBatch(strings: string[]): string[] {
        return strings.map(s => this.resolve(s));
    }

    private resolvePath(path: string): BindingValue {
        const segments = path.split(NESTED_PATH_PATTERN);
        if (segments.length === 0) return null;

        const rootName = segments[0];
        const root = this.bindings.get(rootName);
        if (!root) return null;

        let current: unknown = root;
        for (let i = 1; i < segments.length; i++) {
            const key = segments[i];
            if (current === null || typeof current !== 'object') return null;

            const value = (current as Record<string, unknown>)[key];
            if (value === undefined) return null;

            if (typeof value === 'function') {
                current = (value as () => BindingValue)();
            } else {
                current = value;
            }
        }

        if (typeof current === 'string' || typeof current === 'number' || typeof current === 'boolean' || current === null) {
            return current;
        }
        return String(current);
    }

    getRegisteredContexts(): string[] {
        return Array.from(this.bindings.keys());
    }

    clear(): void {
        this.bindings.clear();
    }
}
