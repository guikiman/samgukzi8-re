import type { RelationshipEdge, RelationType } from "./types";
export interface SerializedRelationship {
    source: string;
    target: string;
    type: RelationType;
    affinity: number;
    history: Array<{
        year: number;
        month: number;
        event: string;
        delta: number;
    }>;
}
export interface RelationshipSnapshot {
    version: number;
    timestamp: number;
    edges: SerializedRelationship[];
    officerIndex: string[];
}
export declare class RelationshipSerializer {
    private readonly VERSION;
    serialize(store: Map<string, Map<string, RelationshipEdge>>): string;
    deserialize(json: string): {
        store: Map<string, Map<string, RelationshipEdge>>;
        officerIndex: string[];
    };
    estimateSize(store: Map<string, Map<string, RelationshipEdge>>): number;
    compress(store: Map<string, Map<string, RelationshipEdge>>): string;
    decompress(data: string): {
        store: Map<string, Map<string, RelationshipEdge>>;
        officerIndex: string[];
    };
}
//# sourceMappingURL=relationship_serializer.d.ts.map