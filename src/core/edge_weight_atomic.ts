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

const DEFAULT_CONFIG: EdgeWeightConfig = {
  minAffinity: -100,
  maxAffinity: 100,
  maxDeltaPerUpdate: 50,
};

export class EdgeWeightAtomic {
  private edges = new Map<string, RelationshipEdge>();
  private listeners = new Set<AffinityChangeListener>();
  private config: EdgeWeightConfig;
  private changeHistory = new Map<string, { oldAffinity: number }[]>();

  constructor(config?: Partial<EdgeWeightConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private edgeKey(source: OfficerID, target: OfficerID, type: RelationType): string {
    return `${source}_${target}_${type}`;
  }

  registerEdge(edge: RelationshipEdge): void {
    this.edges.set(this.edgeKey(edge.source, edge.target, edge.type), edge);
  }

  updateAffinity(
    source: OfficerID,
    target: OfficerID,
    type: RelationType,
    delta: number,
    reason: string,
    year: number,
    month: number,
  ): { success: boolean; oldAffinity: number; newAffinity: number; clamped: boolean } {
    const key = this.edgeKey(source, target, type);
    let edge = this.edges.get(key);
    if (!edge) {
      const reverseKey = this.edgeKey(target, source, type);
      edge = this.edges.get(reverseKey);
    }
    if (!edge) return { success: false, oldAffinity: 0, newAffinity: 0, clamped: false };

    const clampedDelta = Math.max(-this.config.maxDeltaPerUpdate, Math.min(this.config.maxDeltaPerUpdate, delta));
    const oldAffinity = edge.affinity;
    let newAffinity = oldAffinity + clampedDelta;
    let clamped = false;

    if (newAffinity > this.config.maxAffinity) {
      newAffinity = this.config.maxAffinity;
      clamped = true;
    }
    if (newAffinity < this.config.minAffinity) {
      newAffinity = this.config.minAffinity;
      clamped = true;
    }

    edge.affinity = newAffinity;
    edge.history.push({ year, month, event: reason, delta: clampedDelta });

    if (!this.changeHistory.has(key)) this.changeHistory.set(key, []);
    this.changeHistory.get(key)!.push({ oldAffinity });

    const event: AffinityChangeEvent = {
      source, target, type, oldAffinity, newAffinity, delta: clampedDelta, timestamp: Date.now(), reason,
    };
    for (const listener of this.listeners) listener(event);

    return { success: true, oldAffinity, newAffinity, clamped };
  }

  getAffinity(source: OfficerID, target: OfficerID, type: RelationType): number | null {
    const edge = this.getEdge(source, target, type);
    return edge?.affinity ?? null;
  }

  getEdge(source: OfficerID, target: OfficerID, type: RelationType): RelationshipEdge | null {
    return this.edges.get(this.edgeKey(source, target, type))
      ?? this.edges.get(this.edgeKey(target, source, type))
      ?? null;
  }

  subscribe(listener: AffinityChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  rollbackLastChange(source: OfficerID, target: OfficerID, type: RelationType): boolean {
    const key = this.edgeKey(source, target, type);
    const history = this.changeHistory.get(key);
    if (!history || history.length === 0) return false;

    const entry = history.pop()!;
    const edge = this.edges.get(key);
    if (edge) {
      edge.affinity = entry.oldAffinity;
      edge.history.pop();
    }
    return true;
  }

  getChangeHistory(source: OfficerID, target: OfficerID, type: RelationType): RelationshipEdge["history"] {
    const edge = this.getEdge(source, target, type);
    return edge ? [...edge.history] : [];
  }

  clearEdges(): void {
    this.edges.clear();
    this.changeHistory.clear();
  }
}
