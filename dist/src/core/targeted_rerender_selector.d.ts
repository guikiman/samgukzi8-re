/**
 * [Task 93] 동적 타겟 리렌더링 셀렉터 — TargetedRerenderSelector
 *
 * 변경된 상태에 따라 최소한의 UI 요소만 리렌더링하도록 계산.
 */
import type { NormalizedState, GlobalState } from "./types.js";
export interface RenderTarget {
    readonly targetType: "OFFICER" | "FACTION" | "CITY" | "ARMY" | "RELATIONSHIP" | "GLOBAL" | "PHASE";
    readonly targetId?: string;
    readonly priority: "HIGH" | "MEDIUM" | "LOW";
}
export declare class TargetedRerenderSelector {
    private previousState;
    private previousGlobal;
    computeTargets(currentState: NormalizedState, currentGlobal: GlobalState): RenderTarget[];
    reset(): void;
    private deepCloneState;
    shouldRerender(targets: RenderTarget[], targetType: RenderTarget["targetType"], targetId?: string): boolean;
}
//# sourceMappingURL=targeted_rerender_selector.d.ts.map