export type ClickType = "left" | "right" | "double";
export interface HexClickEvent {
    readonly q: number;
    readonly r: number;
    readonly type: ClickType;
    readonly screenX: number;
    readonly screenY: number;
}
export declare class HexClickHandler {
    private listeners;
    screenToHex(screenX: number, screenY: number, hexSize: number, offsetX: number, offsetY: number): {
        q: number;
        r: number;
    };
    onTileClick(q: number, r: number, handler: (event: HexClickEvent) => void): void;
    handleClick(event: HexClickEvent): void;
}
//# sourceMappingURL=hex_click_handler.d.ts.map