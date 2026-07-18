/**
 * [10] 데드락 방지 '이벤트 서사 그래프(Story DAG)' 파서
 *
 * EventDAGParser:
 *   - 모든 이벤트 관계를 유향 비순환 그래프(DAG) 구조로 정규화
 *   - 상충 조건 발생 시 사전 예외 처리 및 우회
 *   - XState 상태 머신 기반 정적 세이브 분석기
 */
export interface StoryEventNode {
    readonly id: string;
    readonly prerequisites: readonly string[];
    readonly conflictsWith: readonly string[];
    readonly priority: number;
}
export interface DAGValidationResult {
    readonly hasCycle: boolean;
    readonly cyclePath: readonly string[];
    readonly deadlockedEvents: readonly string[];
    readonly resolvedConflicts: readonly string[];
}
export declare class EventDAGParser {
    private nodes;
    private completedEvents;
    registerNode(node: StoryEventNode): void;
    completeEvent(id: string): void;
    /**
     * [10] DAG 정적 분석 — 데드락 및 사이클 감지
     */
    validateDAG(): DAGValidationResult;
    private areBothActive;
    private resolveConflicts;
}
//# sourceMappingURL=event_dag.d.ts.map