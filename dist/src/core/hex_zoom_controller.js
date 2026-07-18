export class HexZoomController {
    constructor(minZoom = 0.3, maxZoom = 3, zoomStep = 0.1) {
        this.currentZoom = 1;
        this.minZoom = minZoom;
        this.maxZoom = maxZoom;
        this.zoomStep = zoomStep;
    }
    zoomIn() {
        this.currentZoom = Math.min(this.currentZoom + this.zoomStep, this.maxZoom);
        return this.currentZoom;
    }
    zoomOut() {
        this.currentZoom = Math.max(this.currentZoom - this.zoomStep, this.minZoom);
        return this.currentZoom;
    }
    zoomWheel(delta) {
        if (delta > 0)
            return this.zoomOut();
        return this.zoomIn();
    }
    setZoom(level) {
        this.currentZoom = Math.max(this.minZoom, Math.min(this.maxZoom, level));
    }
    get zoom() {
        return this.currentZoom;
    }
}
//# sourceMappingURL=hex_zoom_controller.js.map