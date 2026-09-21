/**
 * [Phase 3] Canvas2D 헥사곤 맵 렌더러 — HexMapCanvasRenderer
 *
 * WebGL 없이 Canvas2D로 헥사곤 지도를 60fps 렌더링.
 * Axial 좌표계(q, r) 기반, 지형/도시/포그 렌더링.
 */
export declare function hexToPixel(q: number, r: number, size: number): {
    x: number;
    y: number;
};
export declare function pixelToHex(px: number, py: number, size: number): {
    q: number;
    r: number;
};
export interface HexTile {
    q: number;
    r: number;
    terrain: string;
    elevation?: number;
    isFogged?: boolean;
    isExplored?: boolean;
    label?: string;
    ownerColor?: string;
    isSelected?: boolean;
    isHighlighted?: boolean;
}
export interface HexMapView {
    offsetX: number;
    offsetY: number;
    zoom: number;
    hexSize: number;
}
export declare class HexMapCanvasRenderer {
    private canvas;
    private ctx;
    private hexSize;
    private offsetX;
    private offsetY;
    private zoom;
    private hoveredHex;
    constructor(canvas: HTMLCanvasElement);
    setView(view: Partial<HexMapView>): void;
    setHoveredHex(hex: {
        q: number;
        r: number;
    } | null): void;
    render(tiles: HexTile[], width: number, height: number): void;
    private drawHexTile;
    /**
     * 화면 픽셀 좌표 → 헥스 좌표 변환
     */
    screenToHex(px: number, py: number): {
        q: number;
        r: number;
    };
    /**
     * 드래그로 뷰 이동
     */
    pan(dx: number, dy: number): void;
    /**
     * 줌 인/아웃
     */
    zoomAt(factor: number, centerPx: number, centerPy: number): void;
    getState(): HexMapView;
}
//# sourceMappingURL=hex_map_canvas_renderer.d.ts.map