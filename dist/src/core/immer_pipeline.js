/**
 * [Task 48] Immer 기반 불변 업데이트 파이프라인 — ImmerPipeline
 *
 * Immer 스타일 produce API로 불변 상태 업데이트를 안전하게 처리.
 */
export class ImmerPipeline {
    produce(base, recipe) {
        const draft = this.createDraft(base);
        recipe(draft);
        return this.finishDraft(base, draft);
    }
    produceGlobal(base, recipe) {
        const draft = this.createDraft(base);
        recipe(draft);
        return this.finishDraft(base, draft);
    }
    isDirty(original, modified) {
        if (original === modified)
            return false;
        for (const key of Object.keys(original)) {
            if (original[key] !== modified[key])
                return true;
        }
        return false;
    }
    getChangedPaths(original, modified) {
        const paths = [];
        for (const key of Object.keys(original)) {
            if (original[key] !== modified[key])
                paths.push(key);
        }
        return paths;
    }
    createDraft(base) {
        if (Array.isArray(base))
            return [...base];
        const draft = Object.create(Object.getPrototypeOf(base));
        for (const key of Object.keys(base)) {
            const val = base[key];
            if (typeof val === "object" && val !== null) {
                draft[key] = this.createDraft(val);
            }
            else {
                draft[key] = val;
            }
        }
        return draft;
    }
    finishDraft(base, draft) {
        if (base === draft)
            return { newState: draft, changed: false, changedPaths: [] };
        const changedPaths = [];
        for (const key of Object.keys(base)) {
            if (base[key] !== draft[key]) {
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
//# sourceMappingURL=immer_pipeline.js.map