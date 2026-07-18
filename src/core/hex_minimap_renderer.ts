export interface MinimapViewport {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export class HexMinimapRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private readonly scale: number;

  constructor(scale = 0.05) {
    this.scale = scale;
  }

  initialize(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
  }

  render(hexColors: Map<string, [number, number, number]>, viewport: MinimapViewport, mapWidth: number, mapHeight: number): void {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    for (const [key, color] of hexColors) {
      const [q, r] = key.split(",").map(Number);
      const x = (q + r * 0.5) * this.scale * w;
      const y = r * this.scale * h * 0.866;
      ctx.fillStyle = `rgb(${color[0] * 255},${color[1] * 255},${color[2] * 255})`;
      ctx.fillRect(x, y, 2, 2);
    }

    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = 1;
    ctx.strokeRect(viewport.x * this.scale, viewport.y * this.scale, viewport.w * this.scale, viewport.h * this.scale);
  }

  screenToWorld(screenX: number, screenY: number): { q: number; r: number } {
    return { q: Math.round(screenX / this.scale), r: Math.round(screenY / (this.scale * 0.866)) };
  }
}
