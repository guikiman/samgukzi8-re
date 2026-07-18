export declare class InteractiveMap {
    private canvas;
    private ctx;
    private width;
    private height;
    private offsetX;
    private offsetY;
    private scale;
    private isDragging;
    private dragStartX;
    private dragStartY;
    private hexRadius;
    private regions;
    attach(canvas: HTMLCanvasElement, width: number, height: number): void;
    setRegions(regions: Array<{
        id: string;
        name: string;
        q: number;
        r: number;
        color: string;
        owner: string;
        garrison: number;
    }>): void;
    render(): void;
    private drawHex;
    private drawHexLabel;
    private hexToPixel;
    pixelToHex(px: number, py: number): {
        q: number;
        r: number;
    };
    private onZoom;
    private onDragStart;
    private onDragMove;
    private onDragEnd;
    getRegionAt(px: number, py: number): string | null;
}
//# sourceMappingURL=interactive_map.d.ts.map