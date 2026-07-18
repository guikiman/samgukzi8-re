/**
 * [76] 인간관계 가중치 인접 행렬 — AdjacencyMatrixTracker
 * 
 * 목적: 1,000명의 무장 관계를 행렬로 관리.
 */
export class AdjacencyMatrixTracker {
    private matrix: Map<string, Map<string, number>> = new Map();

    public setRelation(a: string, b: string, weight: number): void {
        if (!this.matrix.has(a)) this.matrix.set(a, new Map());
        this.matrix.get(a)!.set(b, weight);
    }
}
