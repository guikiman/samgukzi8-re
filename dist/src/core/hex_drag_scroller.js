export class HexDragScroller {
    constructor() {
        this.isDragging = false;
        this.lastX = 0;
        this.lastY = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        this.panX = 0;
        this.panY = 0;
    }
    startDrag(screenX, screenY) {
        this.isDragging = true;
        this.lastX = screenX;
        this.lastY = screenY;
        this.velocityX = 0;
        this.velocityY = 0;
    }
    moveDrag(screenX, screenY) {
        if (!this.isDragging)
            return;
        const dx = screenX - this.lastX;
        const dy = screenY - this.lastY;
        this.panX += dx;
        this.panY += dy;
        this.velocityX = dx;
        this.velocityY = dy;
        this.lastX = screenX;
        this.lastY = screenY;
    }
    endDrag() {
        this.isDragging = false;
    }
    updateInertia() {
        this.velocityX *= 0.9;
        this.velocityY *= 0.9;
        if (Math.abs(this.velocityX) < 0.5)
            this.velocityX = 0;
        if (Math.abs(this.velocityY) < 0.5)
            this.velocityY = 0;
        return { dx: this.velocityX, dy: this.velocityY };
    }
    get dragging() {
        return this.isDragging;
    }
}
//# sourceMappingURL=hex_drag_scroller.js.map