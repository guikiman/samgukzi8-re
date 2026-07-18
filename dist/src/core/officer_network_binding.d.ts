/**
 * [Task 5/6] 도시/세력/무장 그래프 아키텍처 바인딩
 *
 * 맵 데이터와 세력, 도시 거점, 무장 관계 네트워크가
 * 관계형 그래프 구조로 연결되어 상태 트리에 매핑.
 */
export interface GraphRelation {
    readonly type: "allegiance" | "friendship" | "rivalry" | "sworn" | "hatred";
    readonly targetId: string;
    readonly value: number;
}
export declare class OfficerNetworkBinding {
    private adjacency;
    addRelation(sourceId: string, relation: GraphRelation): void;
    getRelations(officerId: string): readonly GraphRelation[];
    getRelationsByType(officerId: string, type: GraphRelation["type"]): GraphRelation[];
    getAllegiance(officerId: string): string | null;
    removeOfficer(officerId: string): void;
    get nodeCount(): number;
    get edgeCount(): number;
}
//# sourceMappingURL=officer_network_binding.d.ts.map