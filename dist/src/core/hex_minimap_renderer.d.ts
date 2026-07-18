export interface MinimapViewport {
    readonly x: number;
    readonly y: number;
    readonly w: number;
    readonly h: number;
}
export declare class HexMinimapRenderer {
    private canvas;
    private ctx;
    private readonly scale;
    constructor(scale?: number);
    initialize(canvas: HTMLCanvasElement): void;
    render(hexColors: Map<string, [number, number, number]>, viewport: MinimapViewport, mapWidth: number, mapHeight: number): void;
    screenToWorld(screenX: number, screenY: number): {
        q: number;
        r: number;
    };
}
//# sourceMappingURL=hex_minimap_renderer.d.ts.map