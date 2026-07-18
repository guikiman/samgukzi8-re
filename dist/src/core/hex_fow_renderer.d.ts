export type FogState = "visible" | "explored" | "hidden";
export declare class HexFoWRenderer {
    private fogMap;
    setFog(q: number, r: number, state: FogState): void;
    getFog(q: number, r: number): FogState;
    getFogAlpha(q: number, r: number): number;
    clearAll(): void;
}
//# sourceMappingURL=hex_fow_renderer.d.ts.map