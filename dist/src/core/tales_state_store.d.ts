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
export declare class TalesStateStore {
    private scenarios;
    activateScenario(scenarioId: ScenarioId): boolean;
    completeScenario(scenarioId: ScenarioId): boolean;
    activateBranch(scenarioId: ScenarioId, branchId: BranchId, parentBranch?: BranchId | null): boolean;
    completeBranch(scenarioId: ScenarioId, branchId: BranchId): boolean;
    isScenarioActive(scenarioId: ScenarioId): boolean;
    isScenarioCompleted(scenarioId: ScenarioId): boolean;
    isBranchActive(scenarioId: ScenarioId, branchId: BranchId): boolean;
    getActiveScenarioCount(): number;
    getCompletedScenarioCount(): number;
    getScenarioState(scenarioId: ScenarioId): ScenarioState | undefined;
    getBranchNode(scenarioId: ScenarioId, branchId: BranchId): BranchNode | undefined;
    serialize(): SerializedTalesState;
    deserialize(data: SerializedTalesState): void;
    clear(): void;
}
//# sourceMappingURL=tales_state_store.d.ts.map