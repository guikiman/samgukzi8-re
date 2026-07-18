export type GestureType = "tap" | "longPress" | "swipe";

export class HexGestureRecognizer {
  private touchStartTime = 0;
  private touchStartX = 0;
  private touchStartY = 0;
  private readonly longPressDuration = 500;
  private readonly swipeThreshold = 30;

  onTouchStart(x: number, y: number): void {
    this.touchStartTime = Date.now();
    this.touchStartX = x;
    this.touchStartY = y;
  }

  onTouchEnd(x: number, y: number): GestureType {
    const elapsed = Date.now() - this.touchStartTime;
    const dx = x - this.touchStartX;
    const dy = y - this.touchStartY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > this.swipeThreshold) return "swipe";
    if (elapsed > this.longPressDuration) return "longPress";
    return "tap";
  }
}
