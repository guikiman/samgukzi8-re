import type { RelationshipEdge, RelationType } from "./types";

export interface SerializedRelationship {
  source: string;
  target: string;
  type: RelationType;
  affinity: number;
  history: Array<{ year: number; month: number; event: string; delta: number }>;
}

export interface RelationshipSnapshot {
  version: number;
  timestamp: number;
  edges: SerializedRelationship[];
  officerIndex: string[];
}

export class RelationshipSerializer {
  private readonly VERSION = 1;

  serialize(store: Map<string, Map<string, RelationshipEdge>>): string {
    const edges: SerializedRelationship[] = [];
    const officerSet = new Set<string>();

    for (const [sourceId, targets] of store) {
      officerSet.add(sourceId);
      for (const [targetId, edge] of targets) {
        officerSet.add(targetId);
        edges.push({
          source: sourceId,
          target: targetId,
          type: edge.type,
          affinity: edge.affinity,
          history: edge.history.map(h => ({ ...h })),
        });
      }
    }

    const snapshot: RelationshipSnapshot = {
      version: this.VERSION,
      timestamp: Date.now(),
      edges,
      officerIndex: Array.from(officerSet),
    };

    return JSON.stringify(snapshot);
  }

  deserialize(json: string): { store: Map<string, Map<string, RelationshipEdge>>; officerIndex: string[] } {
    const snapshot: RelationshipSnapshot = JSON.parse(json);
    const store = new Map<string, Map<string, RelationshipEdge>>();

    for (const edge of snapshot.edges) {
      if (!store.has(edge.source)) {
        store.set(edge.source, new Map());
      }
      store.get(edge.source)!.set(edge.target, {
        source: edge.source,
        target: edge.target,
        type: edge.type,
        affinity: edge.affinity,
        history: edge.history.map(h => ({ year: h.year, month: h.month, event: h.event, delta: h.delta })),
      });

      if (!store.has(edge.target)) {
        store.set(edge.target, new Map());
      }
      if (!store.get(edge.target)!.has(edge.source)) {
        store.get(edge.target)!.set(edge.source, {
          source: edge.target,
          target: edge.source,
          type: edge.type,
          affinity: edge.affinity,
          history: [...edge.history],
        });
      }
    }

    return { store, officerIndex: snapshot.officerIndex };
  }

  estimateSize(store: Map<string, Map<string, RelationshipEdge>>): number {
    let edgeCount = 0;
    for (const [, targets] of store) {
      edgeCount += targets.size;
    }
    const json = this.serialize(store);
    return new TextEncoder().encode(json).length;
  }

  compress(store: Map<string, Map<string, RelationshipEdge>>): string {
    const json = this.serialize(store);
    let hash = 0x811C9DC5;
    const bytes = new TextEncoder().encode(json);
    for (let i = 0; i < bytes.length; i++) {
      hash ^= bytes[i];
      hash = Math.imul(hash, 0x01000193);
    }
    return `${hash.toString(16)}:${json.length}:${json}`;
  }

  decompress(data: string): { store: Map<string, Map<string, RelationshipEdge>>; officerIndex: string[] } {
    const colonIdx = data.indexOf(":");
    const secondColon = data.indexOf(":", colonIdx + 1);
    const expectedHash = parseInt(data.slice(0, colonIdx), 16);
    const expectedLen = parseInt(data.slice(colonIdx + 1, secondColon), 16);
    const json = data.slice(secondColon + 1);

    let hash = 0x811C9DC5;
    const bytes = new TextEncoder().encode(json);
    for (let i = 0; i < bytes.length; i++) {
      hash ^= bytes[i];
      hash = Math.imul(hash, 0x01000193);
    }
    if ((hash >>> 0) !== expectedHash) {
      throw new Error("Relationship data integrity check failed");
    }
    if (json.length !== expectedLen) {
      throw new Error("Relationship data length mismatch");
    }

    return this.deserialize(json);
  }
}