/**
 * [Task 48] Immer 기반 불변 업데이트 파이프라인 — ImmerPipeline
 *
 * Immer 스타일 produce API로 불변 상태 업데이트를 안전하게 처리.
 */
import type { NormalizedState, GlobalState } from "./types.js";
export type ProduceResult<T> = {
    readonly newState: T;
    readonly changed: boolean;
    readonly changedPaths: string[];
};
export declare class ImmerPipeline {
    produce(base: NormalizedState, recipe: (draft: NormalizedState) => void): ProduceResult<NormalizedState>;
    produceGlobal(base: GlobalState, recipe: (draft: GlobalState) => void): ProduceResult<GlobalState>;
    isDirty(original: NormalizedState, modified: NormalizedState): boolean;
    getChangedPaths(original: NormalizedState, modified: NormalizedState): string[];
    createDraft<T extends object>(base: T): T;
    finishDraft<T extends object>(base: T, draft: T): ProduceResult<T>;
}
//# sourceMappingURL=immer_pipeline.d.ts.map