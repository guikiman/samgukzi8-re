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

export class OfficerNetworkBinding {
  private adjacency = new Map<string, Set<GraphRelation>>();

  addRelation(sourceId: string, relation: GraphRelation): void {
    if (!this.adjacency.has(sourceId)) {
      this.adjacency.set(sourceId, new Set());
    }
    this.adjacency.get(sourceId)!.add(relation);
  }

  getRelations(officerId: string): readonly GraphRelation[] {
    return Array.from(this.adjacency.get(officerId) ?? []);
  }

  getRelationsByType(officerId: string, type: GraphRelation["type"]): GraphRelation[] {
    return Array.from(this.adjacency.get(officerId) ?? []).filter((r) => r.type === type);
  }

  getAllegiance(officerId: string): string | null {
    const relations = this.getRelationsByType(officerId, "allegiance");
    return relations.length > 0 ? relations[0].targetId : null;
  }

  removeOfficer(officerId: string): void {
    this.adjacency.delete(officerId);
    for (const [, relations] of this.adjacency) {
      for (const rel of relations) {
        if (rel.targetId === officerId) relations.delete(rel);
      }
    }
  }

  get nodeCount(): number {
    return this.adjacency.size;
  }

  get edgeCount(): number {
    let count = 0;
    for (const [, relations] of this.adjacency) count += relations.size;
    return count;
  }
}
