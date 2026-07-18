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

export class ImmerPipeline {
  produce(base: NormalizedState, recipe: (draft: NormalizedState) => void): ProduceResult<NormalizedState> {
    const draft = this.createDraft(base);
    recipe(draft);
    return this.finishDraft(base, draft);
  }

  produceGlobal(base: GlobalState, recipe: (draft: GlobalState) => void): ProduceResult<GlobalState> {
    const draft = this.createDraft(base);
    recipe(draft);
    return this.finishDraft(base, draft);
  }

  isDirty(original: NormalizedState, modified: NormalizedState): boolean {
    if (original === modified) return false;
    for (const key of Object.keys(original) as (keyof NormalizedState)[]) {
      if (original[key] !== modified[key]) return true;
    }
    return false;
  }

  getChangedPaths(original: NormalizedState, modified: NormalizedState): string[] {
    const paths: string[] = [];
    for (const key of Object.keys(original) as (keyof NormalizedState)[]) {
      if (original[key] !== modified[key]) paths.push(key);
    }
    return paths;
  }

  createDraft<T extends object>(base: T): T {
    if (Array.isArray(base)) return [...base] as T;
    const draft = Object.create(Object.getPrototypeOf(base));
    for (const key of Object.keys(base as Record<string, unknown>)) {
      const val = (base as Record<string, unknown>)[key];
      if (typeof val === "object" && val !== null) {
        (draft as Record<string, unknown>)[key] = this.createDraft(val as Record<string, unknown>);
      } else {
        (draft as Record<string, unknown>)[key] = val;
      }
    }
    return draft;
  }

  finishDraft<T extends object>(base: T, draft: T): ProduceResult<T> {
    if (base === draft) return { newState: draft, changed: false, changedPaths: [] };
    const changedPaths: string[] = [];
    for (const key of Object.keys(base as Record<string, unknown>)) {
      if ((base as Record<string, unknown>)[key] !== (draft as Record<string, unknown>)[key]) {
        changedPaths.push(key);
      }
    }
    return {
      newState: draft,
      changed: changedPaths.length > 0,
      changedPaths,
    };
  }
}
