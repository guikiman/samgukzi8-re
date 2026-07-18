/**
 * [Task 24] 에지 가중치 업데이트 원자화 — EdgeWeightAtomic
 *
 * 친밀도 변경을 원자적으로 수행하고 이벤트 발행.
 */
import type { OfficerID, RelationType, RelationshipEdge } from "./types.js";
export interface AffinityChangeEvent {
    readonly source: OfficerID;
    readonly target: OfficerID;
    readonly type: RelationType;
    readonly oldAffinity: number;
    readonly newAffinity: number;
    readonly delta: number;
    readonly timestamp: number;
    readonly reason: string;
}
export type AffinityChangeListener = (event: AffinityChangeEvent) => void;
export interface EdgeWeightConfig {
    readonly minAffinity: number;
    readonly maxAffinity: number;
    readonly maxDeltaPerUpdate: number;
}
export declare class EdgeWeightAtomic {
    private edges;
    private listeners;
    private config;
    private changeHistory;
    constructor(config?: Partial<EdgeWeightConfig>);
    private edgeKey;
    registerEdge(edge: RelationshipEdge): void;
    updateAffinity(source: OfficerID, target: OfficerID, type: RelationType, delta: number, reason: string, year: number, month: number): {
        success: boolean;
        oldAffinity: number;
        newAffinity: number;
        clamped: boolean;
    };
    getAffinity(source: OfficerID, target: OfficerID, type: RelationType): number | null;
    getEdge(source: OfficerID, target: OfficerID, type: RelationType): RelationshipEdge | null;
    subscribe(listener: AffinityChangeListener): () => void;
    rollbackLastChange(source: OfficerID, target: OfficerID, type: RelationType): boolean;
    getChangeHistory(source: OfficerID, target: OfficerID, type: RelationType): RelationshipEdge["history"];
    clearEdges(): void;
}
//# sourceMappingURL=edge_weight_atomic.d.ts.map