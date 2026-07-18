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

export class FactionClustering {
  cluster(
    relationships: RelationshipEdge[],
    officerIds: OfficerID[],
    minAffinityThreshold = 30,
  ): ClusteringResult {
    const adjacency = new Map<OfficerID, OfficerID[]>();
    const affinityMap = new Map<string, number>();
    const officerSet = new Set(officerIds);

    for (const rel of relationships) {
      if (!officerSet.has(rel.source) || !officerSet.has(rel.target)) continue;
      if (rel.affinity < minAffinityThreshold) continue;

      const key = [rel.source, rel.target].sort().join("_");
      const existing = affinityMap.get(key) ?? 0;
      affinityMap.set(key, Math.max(existing, rel.affinity));

      if (!adjacency.has(rel.source)) adjacency.set(rel.source, []);
      if (!adjacency.has(rel.target)) adjacency.set(rel.target, []);
      adjacency.get(rel.source)!.push(rel.target);
      adjacency.get(rel.target)!.push(rel.source);
    }

    const visited = new Set<OfficerID>();
    const clusters: Cluster[] = [];
    const unaffiliated: OfficerID[] = [];
    let clusterId = 0;

    for (const id of officerIds) {
      if (visited.has(id)) continue;
      if (!adjacency.has(id)) {
        visited.add(id);
        unaffiliated.push(id);
        continue;
      }

      const component: OfficerID[] = [];
      const stack = [id];
      while (stack.length > 0) {
        const current = stack.pop()!;
        if (visited.has(current)) continue;
        visited.add(current);
        component.push(current);
        const neighbors = adjacency.get(current) ?? [];
        for (const n of neighbors) {
          if (!visited.has(n)) stack.push(n);
        }
      }

      if (component.length >= 2) {
        const clusterEdges = this.countEdges(component, relationships, adjacency);
        const density = component.length > 1
          ? (2 * clusterEdges.internal) / (component.length * (component.length - 1))
          : 0;
        clusters.push({
          id: clusterId++,
          officerIds: component,
          internalEdges: clusterEdges.internal,
          externalEdges: clusterEdges.external,
          density: Math.round(density * 100) / 100,
          averageAffinity: Math.round(clusterEdges.avgAffinity * 100) / 100,
          label: `Cluster ${clusterId}`,
        });
      } else {
        unaffiliated.push(component[0]);
      }
    }

    const modularity = this.calculateModularity(clusters, relationships, officerIds.length);

    return { clusters, unaffiliatedOfficers: unaffiliated, modularity: Math.round(modularity * 100) / 100 };
  }

  private countEdges(
    component: OfficerID[],
    relationships: RelationshipEdge[],
    adjacency: Map<OfficerID, OfficerID[]>,
  ): { internal: number; external: number; avgAffinity: number } {
    let internal = 0;
    let external = 0;
    let totalAffinity = 0;
    const compSet = new Set(component);

    for (const rel of relationships) {
      if (!compSet.has(rel.source) || !compSet.has(rel.target)) continue;
      const bothIn = compSet.has(rel.source) && compSet.has(rel.target);
      if (bothIn) {
        internal++;
        totalAffinity += rel.affinity;
      } else {
        external++;
      }
    }

    return { internal, external, avgAffinity: internal > 0 ? totalAffinity / internal : 0 };
  }

  private calculateModularity(
    clusters: Cluster[],
    relationships: RelationshipEdge[],
    totalNodes: number,
  ): number {
    if (totalNodes === 0) return 0;
    const m = relationships.length;
    if (m === 0) return 0;

    let q = 0;
    const nodeClusterMap = new Map<OfficerID, number>();
    for (const cluster of clusters) {
      for (const id of cluster.officerIds) {
        nodeClusterMap.set(id, cluster.id);
      }
    }

    for (const rel of relationships) {
      const cA = nodeClusterMap.get(rel.source);
      const cB = nodeClusterMap.get(rel.target);
      if (cA !== undefined && cB !== undefined && cA === cB) {
        q += 1;
      }
    }

    return q / m;
  }

  getClusterForOfficer(officerId: OfficerID, result: ClusteringResult): Cluster | null {
    return result.clusters.find((c) => c.officerIds.includes(officerId)) ?? null;
  }

  mergeClusters(result: ClusteringResult, clusterIdA: number, clusterIdB: number): ClusteringResult {
    const idxA = result.clusters.findIndex((c) => c.id === clusterIdA);
    const idxB = result.clusters.findIndex((c) => c.id === clusterIdB);
    if (idxA === -1 || idxB === -1) return result;

    const a = result.clusters[idxA];
    const b = result.clusters[idxB];
    const mergedOfficers = [...a.officerIds, ...b.officerIds];
    const mergedInternal = a.internalEdges + b.internalEdges;
    const mergedExternal = a.externalEdges + b.externalEdges;
    const density = (2 * mergedInternal) / (mergedOfficers.length * (mergedOfficers.length - 1));
    const avgAff = (a.averageAffinity * a.officerIds.length + b.averageAffinity * b.officerIds.length)
      / (a.officerIds.length + b.officerIds.length);

    const merged: Cluster = {
      id: a.id,
      officerIds: mergedOfficers,
      internalEdges: mergedInternal,
      externalEdges: mergedExternal,
      density: Math.round(density * 100) / 100,
      averageAffinity: Math.round(avgAff * 100) / 100,
      label: `${a.label}+${b.label}`,
    };

    const newClusters = result.clusters.filter((_, i) => i !== idxA && i !== idxB);
    newClusters.push(merged);
    return { clusters: newClusters, unaffiliatedOfficers: result.unaffiliatedOfficers, modularity: result.modularity };
  }

  getLargestCluster(result: ClusteringResult): Cluster | null {
    if (result.clusters.length === 0) return null;
    return result.clusters.reduce((max, c) => c.officerIds.length > max.officerIds.length ? c : max);
  }

  getClusterStats(result: ClusteringResult): { totalClusters: number; avgClusterSize: number; largestClusterSize: number; modularity: number } {
    const total = result.clusters.length;
    const avgSize = total > 0 ? result.clusters.reduce((s, c) => s + c.officerIds.length, 0) / total : 0;
    const largestSize = total > 0 ? Math.max(...result.clusters.map((c) => c.officerIds.length)) : 0;
    return { totalClusters: total, avgClusterSize: Math.round(avgSize * 100) / 100, largestClusterSize: largestSize, modularity: result.modularity };
  }
}
