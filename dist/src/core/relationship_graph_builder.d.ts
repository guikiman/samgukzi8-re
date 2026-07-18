import type { OfficerID, RelationType } from "./types";
export interface GraphNode {
    readonly id: string;
    readonly label: string;
    readonly group: string;
    weight: number;
    readonly color: string;
}
export interface GraphEdge {
    readonly source: string;
    readonly target: string;
    readonly type: RelationType;
    readonly affinity: number;
    readonly width: number;
    readonly color: string;
}
export declare class RelationshipGraphBuilder {
    buildGraph(officers: Array<{
        id: string;
        name: string;
        factionId: string;
    }>, relationships: Array<{
        source: OfficerID;
        target: OfficerID;
        type: RelationType;
        affinity: number;
    }>, centerOfficerId?: string): {
        nodes: GraphNode[];
        edges: GraphEdge[];
    };
    private factionColorIndex;
    private readonly factionColors;
    private getFactionColor;
    generateSVG(nodes: GraphNode[], edges: GraphEdge[], width?: number, height?: number): string;
}
//# sourceMappingURL=relationship_graph_builder.d.ts.map