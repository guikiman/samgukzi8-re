/**
 * [Task 23] 파벌 그래프 클러스터링 — FactionClustering
 *
 * DFS 기반 연결 성분 분석으로 관계 그래프 내 정치 파벌 탐지.
 */
import type { OfficerID, RelationshipEdge } from "./types.js";
export interface Cluster {
    readonly id: number;
    readonly officerIds: OfficerID[];
    readonly internalEdges: number;
    readonly externalEdges: number;
    readonly density: number;
    readonly averageAffinity: number;
    readonly label: string;
}
export interface ClusteringResult {
    readonly clusters: Cluster[];
    readonly unaffiliatedOfficers: OfficerID[];
    readonly modularity: number;
}
export declare class FactionClustering {
    cluster(relationships: RelationshipEdge[], officerIds: OfficerID[], minAffinityThreshold?: number): ClusteringResult;
    private countEdges;
    private calculateModularity;
    getClusterForOfficer(officerId: OfficerID, result: ClusteringResult): Cluster | null;
    mergeClusters(result: ClusteringResult, clusterIdA: number, clusterIdB: number): ClusteringResult;
    getLargestCluster(result: ClusteringResult): Cluster | null;
    getClusterStats(result: ClusteringResult): {
        totalClusters: number;
        avgClusterSize: number;
        largestClusterSize: number;
        modularity: number;
    };
}
//# sourceMappingURL=faction_clustering.d.ts.map