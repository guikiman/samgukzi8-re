/**
 * [106-114] 연의전 사실/가상 분기 관리자 — Scenario Branch Manager
 *
 * Python 원본: src/systems/scenario_branch_manager.py → TypeScript 포팅
 *
 * 설계 스펙:
 * - 사실(Historical) 및 가상(Fictional) 경로 관리
 * - 이벤트 체인 노드(EventChainNode) 그룹화 및 선택적 트리거
 * - event_chain_engine.ts [300]의 큐 관리자와 연동
 */
import { EventEngine, EventChainNode } from './event_chain_engine.js';
export declare enum BranchType {
    HISTORICAL = "historical",
    FICTIONAL = "fictional"
}
export interface ScenarioBranch {
    branchId: string;
    branchType: BranchType;
    /** 이 분기가 활성화되기 위한 조건 이벤트 ID */
    conditionId: string;
    nodes: EventChainNode[];
}
export declare class ScenarioBranchManager {
    private branches;
    private activeBranchId;
    registerBranch(branch: ScenarioBranch): void;
    selectBranch(branchId: string): boolean;
    /** 분기를 선택하고 해당 체인 노드들을 이벤트 엔진 큐에 적재 [300] */
    activateBranch(branchId: string, eventEngine: EventEngine): boolean;
    getActiveBranchId(): string | null;
    getBranch(branchId: string): ScenarioBranch | undefined;
    /** 조건 이벤트(conditionId)가 발생했는지 여부로 활성 가능 분기 조회 */
    getAvailableBranches(firedEventIds: ReadonlySet<string>): ScenarioBranch[];
    reset(): void;
}
export type SpecialEventType = 'EMPEROR_ACCESSION' | 'PLAGUE' | 'DISASTER' | 'REBELLION' | 'OMEN';
export declare class SpecialEventTrigger {
    private readonly eventEngine;
    constructor(eventEngine: EventEngine);
    /** 황제 즉위, 질병, 재해 등 즉시 활성화 트리거 (중복 적재 방지) */
    triggerSpecialEvent(eventType: SpecialEventType, targetId: string): boolean;
}
//# sourceMappingURL=scenario_branch_manager.d.ts.map