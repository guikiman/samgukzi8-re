/**
 * [76] 인간관계 가중치 인접 행렬 — AdjacencyMatrixTracker
 *
 * 목적: 1,000명의 무장 관계를 행렬로 관리.
 */
export class AdjacencyMatrixTracker {
    constructor() {
        this.matrix = new Map();
    }
    setRelation(a, b, weight) {
        if (!this.matrix.has(a))
            this.matrix.set(a, new Map());
        this.matrix.get(a).set(b, weight);
    }
}
//# sourceMappingURL=adjacency_matrix_tracker.js.map