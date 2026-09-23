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
    /**
     * [269 성능] 노드 id → 인덱스 Map. render/exportSVG에서 링크별 nodes.find() O(N·E)
     * 스캔을 O(1) 조회로 대체 — 1,000노드·5,000엣지에서 프레임당 수백만 번의 선형 스캔 제거.
     */
    private nodeIndex;
    private rebuildNodeIndex;
    render(graph: GraphLayout): void;
    startAutoRender(graph: GraphLayout, fps?: number): void;
    stopAutoRender(): void;
    setViewport(v: Partial<Viewport>): void;
    /** 클릭 콜백 — 노드 히트 시 노드 id, 배경 클릭 시 null */
    private onNodeClick;
    private dragging;
    private dragMoved;
    private lastMouse;
    private currentGraph;
    /**
     * 캔버스에 마우스/휠 이벤트를 바인딩한다.
     * 반환값은 정리(detach) 함수 — 패널 닫힘 시 호출.
     */
    attachInteraction(canvas: HTMLCanvasElement, getGraph: () => GraphLayout | null, onNodeClick?: (nodeId: string | null) => void): () => void;
    /** render가 마지막으로 그린 그래프를 기록 — 인터랙션 후 재렌더용 */
    trackGraph(graph: GraphLayout): void;
    exportSVG(graph: GraphLayout, width?: number, height?: number): string;
}
//# sourceMappingURL=relationship_graph_viewer.d.ts.map