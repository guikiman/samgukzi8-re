/**
 * [22] 역사적 트리거 상태 저장소 — TalesStateStore
 *
 * TalesStateStore:
 *   1. 어떤 연의전 시나리오가 활성화되었고, 어떤 분기를 밟았는지 기록
 *   2. 비트 플래그(Bit Flag) 형태로 직렬화하여 경량 세이브 모듈로 저장
 *   3. O(1) 조회 속도 보장 (Map 기반)
 */
export class TalesStateStore {
    constructor() {
        this.scenarios = new Map();
    }
    activateScenario(scenarioId) {
        if (this.scenarios.has(scenarioId))
            return false;
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
    completeScenario(scenarioId) {
        const state = this.scenarios.get(scenarioId);
        if (!state || !state.active)
            return false;
        state.active = false;
        state.completed = true;
        state.completedAt = Date.now();
        return true;
    }
    activateBranch(scenarioId, branchId, parentBranch = null) {
        const state = this.scenarios.get(scenarioId);
        if (!state)
            return false;
        if (state.branches.has(branchId))
            return false;
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
    completeBranch(scenarioId, branchId) {
        const state = this.scenarios.get(scenarioId);
        if (!state)
            return false;
        const branch = state.branches.get(branchId);
        if (!branch)
            return false;
        branch.isActive = false;
        branch.completedAt = Date.now();
        return true;
    }
    isScenarioActive(scenarioId) {
        return this.scenarios.get(scenarioId)?.active ?? false;
    }
    isScenarioCompleted(scenarioId) {
        return this.scenarios.get(scenarioId)?.completed ?? false;
    }
    isBranchActive(scenarioId, branchId) {
        return this.scenarios.get(scenarioId)?.branches.get(branchId)?.isActive ?? false;
    }
    getActiveScenarioCount() {
        let count = 0;
        for (const state of this.scenarios.values()) {
            if (state.active)
                count++;
        }
        return count;
    }
    getCompletedScenarioCount() {
        let count = 0;
        for (const state of this.scenarios.values()) {
            if (state.completed)
                count++;
        }
        return count;
    }
    getScenarioState(scenarioId) {
        return this.scenarios.get(scenarioId);
    }
    getBranchNode(scenarioId, branchId) {
        return this.scenarios.get(scenarioId)?.branches.get(branchId);
    }
    serialize() {
        const scenarios = [];
        for (const state of this.scenarios.values()) {
            const branches = [];
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
    deserialize(data) {
        this.scenarios.clear();
        for (const s of data.scenarios) {
            const branches = new Map();
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
    clear() {
        this.scenarios.clear();
    }
}
//# sourceMappingURL=tales_state_store.js.map