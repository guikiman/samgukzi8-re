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

export class TargetedRerenderSelector {
  private previousState: NormalizedState | null = null;
  private previousGlobal: GlobalState | null = null;

  computeTargets(
    currentState: NormalizedState,
    currentGlobal: GlobalState,
  ): RenderTarget[] {
    const targets: RenderTarget[] = [];
    const prevState = this.previousState;
    const prevGlobal = this.previousGlobal;

    if (!prevState || !prevGlobal) {
      this.previousState = this.deepCloneState(currentState);
      this.previousGlobal = { ...currentGlobal };
      return [{ targetType: "GLOBAL", priority: "HIGH" }];
    }

    if (prevGlobal.phase !== currentGlobal.phase) {
      targets.push({ targetType: "PHASE", priority: "HIGH" });
    }

    if (prevGlobal.turnCount !== currentGlobal.turnCount) {
      targets.push({ targetType: "GLOBAL", priority: "MEDIUM" });
    }

    if (JSON.stringify(prevState.officers) !== JSON.stringify(currentState.officers)) {
      for (const id of Object.keys(currentState.officers)) {
        if (prevState.officers[id] !== currentState.officers[id]) {
          targets.push({ targetType: "OFFICER", targetId: id, priority: "HIGH" });
        }
      }
    }

    if (JSON.stringify(prevState.factions) !== JSON.stringify(currentState.factions)) {
      for (const id of Object.keys(currentState.factions)) {
        if (prevState.factions[id] !== currentState.factions[id]) {
          targets.push({ targetType: "FACTION", targetId: id, priority: "MEDIUM" });
        }
      }
    }

    if (JSON.stringify(prevState.cities) !== JSON.stringify(currentState.cities)) {
      for (const id of Object.keys(currentState.cities)) {
        if (prevState.cities[id] !== currentState.cities[id]) {
          targets.push({ targetType: "CITY", targetId: id, priority: "MEDIUM" });
        }
      }
    }

    if (JSON.stringify(prevState.relationships) !== JSON.stringify(currentState.relationships)) {
      targets.push({ targetType: "RELATIONSHIP", priority: "LOW" });
    }

    this.previousState = this.deepCloneState(currentState);
    this.previousGlobal = { ...currentGlobal };

    return targets;
  }

  reset(): void {
    this.previousState = null;
    this.previousGlobal = null;
  }

  private deepCloneState(state: NormalizedState): NormalizedState {
    return JSON.parse(JSON.stringify(state));
  }

  shouldRerender(targets: RenderTarget[], targetType: RenderTarget["targetType"], targetId?: string): boolean {
    return targets.some((t) => t.targetType === targetType && (targetId === undefined || t.targetId === targetId));
  }
}
