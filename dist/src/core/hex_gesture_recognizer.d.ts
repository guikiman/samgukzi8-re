export type GestureType = "tap" | "longPress" | "swipe";
export declare class HexGestureRecognizer {
    private touchStartTime;
    private touchStartX;
    private touchStartY;
    private readonly longPressDuration;
    private readonly swipeThreshold;
    onTouchStart(x: number, y: number): void;
    onTouchEnd(x: number, y: number): GestureType;
}
//# sourceMappingURL=hex_gesture_recognizer.d.ts.map