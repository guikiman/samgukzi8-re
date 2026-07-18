/**
 * [Task 2] DeepFreeze 기반 상태 불변성 유틸리티
 *
 * 외부 렌더러나 UI가 getState()로 가져간 데이터를
 * 직접 수정하지 못하도록 원천 차단하는 완전 불변 복사 프록시 래퍼.
 */
export declare function deepFreeze<T>(obj: T): T;
export declare function deepClone<T>(obj: T): T;
export declare function freezeState<T extends object>(state: T): Readonly<T>;
//# sourceMappingURL=state_immutability.d.ts.map