export declare class HexZoomController {
    private currentZoom;
    private readonly minZoom;
    private readonly maxZoom;
    private readonly zoomStep;
    constructor(minZoom?: number, maxZoom?: number, zoomStep?: number);
    zoomIn(): number;
    zoomOut(): number;
    zoomWheel(delta: number): number;
    setZoom(level: number): void;
    get zoom(): number;
}
//# sourceMappingURL=hex_zoom_controller.d.ts.map