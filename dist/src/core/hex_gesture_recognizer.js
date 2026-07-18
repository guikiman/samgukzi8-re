export class HexGestureRecognizer {
    constructor() {
        this.touchStartTime = 0;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.longPressDuration = 500;
        this.swipeThreshold = 30;
    }
    onTouchStart(x, y) {
        this.touchStartTime = Date.now();
        this.touchStartX = x;
        this.touchStartY = y;
    }
    onTouchEnd(x, y) {
        const elapsed = Date.now() - this.touchStartTime;
        const dx = x - this.touchStartX;
        const dy = y - this.touchStartY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > this.swipeThreshold)
            return "swipe";
        if (elapsed > this.longPressDuration)
            return "longPress";
        return "tap";
    }
}
//# sourceMappingURL=hex_gesture_recognizer.js.map