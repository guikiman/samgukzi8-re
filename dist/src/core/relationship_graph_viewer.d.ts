/**
 * [Task 92] D3.js/Canvas 하이브리드 인맥 그래프 뷰어 — RelationshipGraphViewer
 *
 * 관계 그래프를 Canvas에 렌더링하고 SVG로 내보내는 뷰어.
 */
import type { RelationshipEdge } from "./types.js";
export interface GraphNode {
    readonly id: string;
    readonly label: string;
    readonly group: string;
    readonly radius: number;
    readonly color: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
}
export interface GraphLink {
    readonly source: string;
    readonly target: string;
    readonly type: string;
    readonly affinity: number;
    readonly color: string;
    readonly width: number;
}
export interface GraphLayout {
    readonly nodes: GraphNode[];
    readonly links: GraphLink[];
}
export interface Viewport {
    x: number;
    y: number;
    zoom: number;
}
export declare class RelationshipGraphViewer {
    private nodes;
    private links;
    private viewport;
    private canvas;
    private ctx;
    private animationId;
    private readonly edgeColors;
    private readonly edgeWidths;
    private readonly factionColors;
    buildGraph(officers: Array<{
        id: string;
        name: string;
        factionId: string;
    }>, relationships: RelationshipEdge[], centerOfficerId?: string): GraphLayout;
    layoutGraph(graph: GraphLayout, width: number, height: number): GraphLayout;
    attachCanvas(canvas: HTMLCanvasElement): void;
    render(graph: GraphLayout): void;
    startAutoRender(graph: GraphLayout, fps?: number): void;
    stopAutoRender(): void;
    setViewport(v: Partial<Viewport>): void;
    exportSVG(graph: GraphLayout, width?: number, height?: number): string;
}
//# sourceMappingURL=relationship_graph_viewer.d.ts.map