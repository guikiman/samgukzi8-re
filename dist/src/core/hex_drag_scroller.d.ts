export declare class HexDragScroller {
    private isDragging;
    private lastX;
    private lastY;
    private velocityX;
    private velocityY;
    private panX;
    private panY;
    startDrag(screenX: number, screenY: number): void;
    moveDrag(screenX: number, screenY: number): void;
    endDrag(): void;
    updateInertia(): {
        dx: number;
        dy: number;
    };
    get dragging(): boolean;
}
//# sourceMappingURL=hex_drag_scroller.d.ts.map