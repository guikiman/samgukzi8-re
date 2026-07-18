export interface TileInfo {
    readonly name: string;
    readonly terrain: string;
    readonly elevation: number;
    readonly owner?: string;
    readonly units?: number;
}
export declare class HexTooltipSystem {
    private tooltipEl;
    initialize(): HTMLDivElement;
    show(info: TileInfo, screenX: number, screenY: number): void;
    hide(): void;
}
//# sourceMappingURL=hex_tooltip_system.d.ts.map