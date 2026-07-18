export type EdgeType = "normal" | "wall" | "river" | "cliff" | "border";
export interface HexEdgeDef {
    readonly q1: number;
    readonly r1: number;
    readonly q2: number;
    readonly r2: number;
    readonly type: EdgeType;
    readonly x1: number;
    readonly y1: number;
    readonly x2: number;
    readonly y2: number;
}
export declare class HexEdgeRenderer {
    private edges;
    private static readonly EDGE_COLORS;
    setEdges(edges: HexEdgeDef[]): void;
    render(ctx: CanvasRenderingContext2D, hexSize: number): void;
}
//# sourceMappingURL=hex_edge_renderer.d.ts.map