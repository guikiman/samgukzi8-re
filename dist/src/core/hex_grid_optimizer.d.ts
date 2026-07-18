export interface ViewportRect {
    readonly x: number;
    readonly y: number;
    readonly w: number;
    readonly h: number;
}
export declare class HexGridOptimizer {
    getVisibleTiles(viewport: ViewportRect, hexSize: number): {
        q: number;
        r: number;
    }[];
    getLODLevel(distance: number): number;
}
//# sourceMappingURL=hex_grid_optimizer.d.ts.map