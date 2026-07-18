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

export class HexEdgeRenderer {
  private edges: HexEdgeDef[] = [];

  private static readonly EDGE_COLORS: Record<EdgeType, string> = {
    normal: "rgba(100, 100, 100, 0.3)",
    wall: "rgba(150, 80, 50, 0.8)",
    river: "rgba(50, 100, 200, 0.6)",
    cliff: "rgba(120, 80, 40, 0.7)",
    border: "rgba(255, 200, 50, 0.5)",
  };

  setEdges(edges: HexEdgeDef[]): void {
    this.edges = edges;
  }

  render(ctx: CanvasRenderingContext2D, hexSize: number): void {
    for (const edge of this.edges) {
      ctx.strokeStyle = HexEdgeRenderer.EDGE_COLORS[edge.type];
      ctx.lineWidth = edge.type === "wall" ? 3 : 1;
      ctx.beginPath();
      ctx.moveTo(edge.x1, edge.y1);
      ctx.lineTo(edge.x2, edge.y2);
      ctx.stroke();
    }
  }
}
