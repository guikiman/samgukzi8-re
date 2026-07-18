export class HexEdgeRenderer {
    constructor() {
        this.edges = [];
    }
    setEdges(edges) {
        this.edges = edges;
    }
    render(ctx, hexSize) {
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
HexEdgeRenderer.EDGE_COLORS = {
    normal: "rgba(100, 100, 100, 0.3)",
    wall: "rgba(150, 80, 50, 0.8)",
    river: "rgba(50, 100, 200, 0.6)",
    cliff: "rgba(120, 80, 40, 0.7)",
    border: "rgba(255, 200, 50, 0.5)",
};
//# sourceMappingURL=hex_edge_renderer.js.map