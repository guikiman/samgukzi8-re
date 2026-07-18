/**
 * [Task 2] DeepFreeze 기반 상태 불변성 유틸리티
 *
 * 외부 렌더러나 UI가 getState()로 가져간 데이터를
 * 직접 수정하지 못하도록 원천 차단하는 완전 불변 복사 프록시 래퍼.
 */

export function deepFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") return obj;
  const propNames = Object.getOwnPropertyNames(obj);
  for (const name of propNames) {
    const value = (obj as Record<string, unknown>)[name];
    (obj as Record<string, unknown>)[name] = deepFreeze(value);
  }
  return Object.freeze(obj) as T;
}

export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Map) {
    const cloned = new Map();
    for (const [k, v] of obj) cloned.set(k, deepClone(v));
    return cloned as T;
  }
  if (obj instanceof Set) {
    const cloned = new Set();
    for (const v of obj) cloned.add(deepClone(v));
    return cloned as T;
  }
  if (Array.isArray(obj)) return obj.map(deepClone) as T;
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj as Record<string, unknown>)) {
    result[key] = deepClone((obj as Record<string, unknown>)[key]);
  }
  return result as T;
}

export function freezeState<T extends object>(state: T): Readonly<T> {
  return deepFreeze(deepClone(state)) as Readonly<T>;
}
