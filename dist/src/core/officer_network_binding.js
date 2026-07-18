/**
 * [Task 5/6] 도시/세력/무장 그래프 아키텍처 바인딩
 *
 * 맵 데이터와 세력, 도시 거점, 무장 관계 네트워크가
 * 관계형 그래프 구조로 연결되어 상태 트리에 매핑.
 */
export class OfficerNetworkBinding {
    constructor() {
        this.adjacency = new Map();
    }
    addRelation(sourceId, relation) {
        if (!this.adjacency.has(sourceId)) {
            this.adjacency.set(sourceId, new Set());
        }
        this.adjacency.get(sourceId).add(relation);
    }
    getRelations(officerId) {
        return Array.from(this.adjacency.get(officerId) ?? []);
    }
    getRelationsByType(officerId, type) {
        return Array.from(this.adjacency.get(officerId) ?? []).filter((r) => r.type === type);
    }
    getAllegiance(officerId) {
        const relations = this.getRelationsByType(officerId, "allegiance");
        return relations.length > 0 ? relations[0].targetId : null;
    }
    removeOfficer(officerId) {
        this.adjacency.delete(officerId);
        for (const [, relations] of this.adjacency) {
            for (const rel of relations) {
                if (rel.targetId === officerId)
                    relations.delete(rel);
            }
        }
    }
    get nodeCount() {
        return this.adjacency.size;
    }
    get edgeCount() {
        let count = 0;
        for (const [, relations] of this.adjacency)
            count += relations.size;
        return count;
    }
}
//# sourceMappingURL=officer_network_binding.js.map