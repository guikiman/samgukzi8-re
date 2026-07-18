export class HexZoomController {
  private currentZoom = 1;
  private readonly minZoom: number;
  private readonly maxZoom: number;
  private readonly zoomStep: number;

  constructor(minZoom = 0.3, maxZoom = 3, zoomStep = 0.1) {
    this.minZoom = minZoom;
    this.maxZoom = maxZoom;
    this.zoomStep = zoomStep;
  }

  zoomIn(): number {
    this.currentZoom = Math.min(this.currentZoom + this.zoomStep, this.maxZoom);
    return this.currentZoom;
  }

  zoomOut(): number {
    this.currentZoom = Math.max(this.currentZoom - this.zoomStep, this.minZoom);
    return this.currentZoom;
  }

  zoomWheel(delta: number): number {
    if (delta > 0) return this.zoomOut();
    return this.zoomIn();
  }

  setZoom(level: number): void {
    this.currentZoom = Math.max(this.minZoom, Math.min(this.maxZoom, level));
  }

  get zoom(): number {
    return this.currentZoom;
  }
}
