export type HexDirection = "NE" | "E" | "SE" | "SW" | "W" | "NW";
export declare class HexKeyboardNav {
    private cursorQ;
    private cursorR;
    moveCursor(direction: HexDirection): void;
    setCursor(q: number, r: number): void;
    get q(): number;
    get r(): number;
}
//# sourceMappingURL=hex_keyboard_nav.d.ts.map