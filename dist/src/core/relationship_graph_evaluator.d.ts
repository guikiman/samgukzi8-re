/**
 * [5] 관계망 그래프 평가자 — Relationship Graph Evaluator
 *
 * O(1) 해시맵 구조 정규화 인덱싱
 * 75% 인맥 필터링 (최대 80명 이웃)
 * Ripple Effect 가중치 기반 전파 연산 (+/-3단계)
 */
import type { OfficerID } from './types.js';
export interface NodeAbilityStats {
    STR: number;
    DEF: number;
    INT: number;
    POL: number;
}
export interface RelationshipEdge {
    type: 'friend' | 'enemy' | 'sworn_brother' | 'neutral';
    weight: number;
    lastUpdated: number;
}
export declare class OfficerGraphNode {
    readonly officerId: OfficerID;
    abilityStats: NodeAbilityStats;
    relationships: {
        enemies: Set<OfficerID>;
        friends: Map<OfficerID, number>;
        swornBrothers: Set<OfficerID>;
    };
    reputation: number;
    constructor(officerId: OfficerID);
}
export declare class RelationshipGraphEvaluator {
    private nodeStore;
    private edgeStore;
    private adjMap;
    readonly maxNeighbors = 80;
    private edgeKey;
    ensureNode(officerId: OfficerID): OfficerGraphNode;
    getNode(officerId: OfficerID): OfficerGraphNode | null;
    setRelationship(fromId: OfficerID, toId: OfficerID, weight: number, type?: 'friend' | 'enemy' | 'sworn_brother'): void;
    getRelationshipWeight(fromId: OfficerID, toId: OfficerID): number;
    getRelationshipType(fromId: OfficerID, toId: OfficerID): string;
    /**
     * Ripple Effect — 인맥 파급 효과
     *
     * BFS 최대 depth 2까지 50% 감쇠 전파
     */
    applyRippleEffect(targetId: OfficerID, sourceId: OfficerID, changeAmount: number, depth?: number): void;
    getNeighbors(officerId: OfficerID): OfficerID[];
    /**
     * Dijkstra 기반 최단 가중치 경로 탐색
     * 가중치 = 100 - 우호도 (높은 우호도 = 낮은 비용)
     */
    shortestPath(from: OfficerID, to: OfficerID): OfficerID[] | null;
    getAllOfficerIds(): OfficerID[];
    nodeCount(): number;
    edgeCount(): number;
    reset(): void;
}
//# sourceMappingURL=relationship_graph_evaluator.d.ts.map