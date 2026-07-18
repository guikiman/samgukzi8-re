export class HexDragScroller {
  private isDragging = false;
  private lastX = 0;
  private lastY = 0;
  private velocityX = 0;
  private velocityY = 0;
  private panX = 0;
  private panY = 0;

  startDrag(screenX: number, screenY: number): void {
    this.isDragging = true;
    this.lastX = screenX;
    this.lastY = screenY;
    this.velocityX = 0;
    this.velocityY = 0;
  }

  moveDrag(screenX: number, screenY: number): void {
    if (!this.isDragging) return;
    const dx = screenX - this.lastX;
    const dy = screenY - this.lastY;
    this.panX += dx;
    this.panY += dy;
    this.velocityX = dx;
    this.velocityY = dy;
    this.lastX = screenX;
    this.lastY = screenY;
  }

  endDrag(): void {
    this.isDragging = false;
  }

  updateInertia(): { dx: number; dy: number } {
    this.velocityX *= 0.9;
    this.velocityY *= 0.9;
    if (Math.abs(this.velocityX) < 0.5) this.velocityX = 0;
    if (Math.abs(this.velocityY) < 0.5) this.velocityY = 0;
    return { dx: this.velocityX, dy: this.velocityY };
  }

  get dragging(): boolean {
    return this.isDragging;
  }
}
