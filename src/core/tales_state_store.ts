/**
 * [22] 역사적 트리거 상태 저장소 — TalesStateStore
 *
 * TalesStateStore:
 *   1. 어떤 연의전 시나리오가 활성화되었고, 어떤 분기를 밟았는지 기록
 *   2. 비트 플래그(Bit Flag) 형태로 직렬화하여 경량 세이브 모듈로 저장
 *   3. O(1) 조회 속도 보장 (Map 기반)
 */

export type BranchId = string;
export type ScenarioId = string;

export interface BranchNode {
    readonly scenarioId: ScenarioId;
    readonly branchId: BranchId;
    readonly parentBranch: BranchId | null;
    readonly isActive: boolean;
    readonly completedAt: number | null;
}

export interface ScenarioState {
    readonly scenarioId: ScenarioId;
    active: boolean;
    completed: boolean;
    completedAt: number | null;
    readonly activatedAt: number;
    branchCount: number;
    readonly branches: Map<BranchId, BranchNode>;
}

export interface SerializedTalesState {
    readonly scenarios: Array<{
        scenarioId: ScenarioId;
        active: boolean;
        completed: boolean;
        completedAt: number | null;
        activatedAt: number;
        branches: Array<{
            branchId: BranchId;
            parentBranch: BranchId | null;
            isActive: boolean;
            completedAt: number | null;
        }>;
    }>;
}

export class TalesStateStore {
    private scenarios: Map<ScenarioId, ScenarioState> = new Map();

    activateScenario(scenarioId: ScenarioId): boolean {
        if (this.scenarios.has(scenarioId)) return false;
        this.scenarios.set(scenarioId, {
            scenarioId,
            active: true,
            completed: false,
            completedAt: null,
            activatedAt: Date.now(),
            branchCount: 0,
            branches: new Map(),
        });
        return true;
    }

    completeScenario(scenarioId: ScenarioId): boolean {
        const state = this.scenarios.get(scenarioId);
        if (!state || !state.active) return false;
        state.active = false;
        state.completed = true;
        state.completedAt = Date.now();
        return true;
    }

    activateBranch(scenarioId: ScenarioId, branchId: BranchId, parentBranch: BranchId | null = null): boolean {
        const state = this.scenarios.get(scenarioId);
        if (!state) return false;
        if (state.branches.has(branchId)) return false;

        state.branches.set(branchId, {
            scenarioId,
            branchId,
            parentBranch,
            isActive: true,
            completedAt: null,
        });
        state.branchCount = state.branches.size;
        return true;
    }

    completeBranch(scenarioId: ScenarioId, branchId: BranchId): boolean {
        const state = this.scenarios.get(scenarioId);
        if (!state) return false;
        const branch = state.branches.get(branchId);
        if (!branch) return false;
        (branch as { isActive: boolean; completedAt: number | null }).isActive = false;
        (branch as { isActive: boolean; completedAt: number | null }).completedAt = Date.now();
        return true;
    }

    isScenarioActive(scenarioId: ScenarioId): boolean {
        return this.scenarios.get(scenarioId)?.active ?? false;
    }

    isScenarioCompleted(scenarioId: ScenarioId): boolean {
        return this.scenarios.get(scenarioId)?.completed ?? false;
    }

    isBranchActive(scenarioId: ScenarioId, branchId: BranchId): boolean {
        return this.scenarios.get(scenarioId)?.branches.get(branchId)?.isActive ?? false;
    }

    getActiveScenarioCount(): number {
        let count = 0;
        for (const state of this.scenarios.values()) {
            if (state.active) count++;
        }
        return count;
    }

    getCompletedScenarioCount(): number {
        let count = 0;
        for (const state of this.scenarios.values()) {
            if (state.completed) count++;
        }
        return count;
    }

    getScenarioState(scenarioId: ScenarioId): ScenarioState | undefined {
        return this.scenarios.get(scenarioId);
    }

    getBranchNode(scenarioId: ScenarioId, branchId: BranchId): BranchNode | undefined {
        return this.scenarios.get(scenarioId)?.branches.get(branchId);
    }

    serialize(): SerializedTalesState {
        const scenarios: SerializedTalesState['scenarios'] = [];
        for (const state of this.scenarios.values()) {
            const branches: SerializedTalesState['scenarios'][0]['branches'] = [];
            for (const branch of state.branches.values()) {
                branches.push({
                    branchId: branch.branchId,
                    parentBranch: branch.parentBranch,
                    isActive: branch.isActive,
                    completedAt: branch.completedAt,
                });
            }
            scenarios.push({
                scenarioId: state.scenarioId,
                active: state.active,
                completed: state.completed,
                completedAt: state.completedAt,
                activatedAt: state.activatedAt,
                branches,
            });
        }
        return { scenarios };
    }

    deserialize(data: SerializedTalesState): void {
        this.scenarios.clear();
        for (const s of data.scenarios) {
            const branches = new Map<BranchId, BranchNode>();
            for (const b of s.branches) {
                branches.set(b.branchId, {
                    scenarioId: s.scenarioId,
                    branchId: b.branchId,
                    parentBranch: b.parentBranch,
                    isActive: b.isActive,
                    completedAt: b.completedAt,
                });
            }
            this.scenarios.set(s.scenarioId, {
                scenarioId: s.scenarioId,
                active: s.active,
                completed: s.completed,
                completedAt: s.completedAt,
                activatedAt: s.activatedAt,
                branchCount: branches.size,
                branches,
            });
        }
    }

    clear(): void {
        this.scenarios.clear();
    }
}
