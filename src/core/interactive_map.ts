export class InteractiveMap {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private width = 800;
  private height = 600;
  private offsetX = 0;
  private offsetY = 0;
  private scale = 1;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private hexRadius = 20;

  private regions: Array<{
    id: string;
    name: string;
    q: number;
    r: number;
    color: string;
    owner: string;
    garrison: number;
  }> = [];

  attach(canvas: HTMLCanvasElement, width: number, height: number): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.width = width;
    this.height = height;
    canvas.width = width;
    canvas.height = height;

    canvas.addEventListener("wheel", (e) => this.onZoom(e));
    canvas.addEventListener("mousedown", (e) => this.onDragStart(e));
    canvas.addEventListener("mousemove", (e) => this.onDragMove(e));
    canvas.addEventListener("mouseup", () => this.onDragEnd());
  }

  setRegions(
    regions: Array<{
      id: string;
      name: string;
      q: number;
      r: number;
      color: string;
      owner: string;
      garrison: number;
    }>,
  ): void {
    this.regions = regions;
  }

  render(): void {
    const ctx = this.ctx;
    if (!ctx || !this.canvas) return;

    ctx.clearRect(0, 0, this.width, this.height);
    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    for (const region of this.regions) {
      this.drawHex(ctx, region.q, region.r, region.color);
      this.drawHexLabel(ctx, region.q, region.r, region.name);
    }

    ctx.restore();
  }

  private drawHex(ctx: CanvasRenderingContext2D, q: number, r: number, color: string): void {
    const { x, y } = this.hexToPixel(q, r);
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const px = x + this.hexRadius * Math.cos(angle);
      const py = y + this.hexRadius * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = "#2c3e50";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  private drawHexLabel(ctx: CanvasRenderingContext2D, q: number, r: number, name: string): void {
    const { x, y } = this.hexToPixel(q, r);
    ctx.fillStyle = "#fff";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name, x, y);
  }

  private hexToPixel(q: number, r: number): { x: number; y: number } {
    const x = this.hexRadius * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
    const y = this.hexRadius * (1.5 * r);
    return { x, y };
  }

  pixelToHex(px: number, py: number): { q: number; r: number } {
    const adjustedX = (px - this.offsetX) / this.scale;
    const adjustedY = (py - this.offsetY) / this.scale;
    const q = ((Math.sqrt(3) / 3) * adjustedX - (1 / 3) * adjustedY) / this.hexRadius;
    const r = ((2 / 3) * adjustedY) / this.hexRadius;
    return { q: Math.round(q), r: Math.round(r) };
  }

  private onZoom(e: WheelEvent): void {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    this.scale = Math.max(0.3, Math.min(3, this.scale * zoomFactor));
    this.render();
  }

  private onDragStart(e: MouseEvent): void {
    this.isDragging = true;
    this.dragStartX = e.clientX - this.offsetX;
    this.dragStartY = e.clientY - this.offsetY;
  }

  private onDragMove(e: MouseEvent): void {
    if (!this.isDragging) return;
    this.offsetX = e.clientX - this.dragStartX;
    this.offsetY = e.clientY - this.dragStartY;
    this.render();
  }

  private onDragEnd(): void {
    this.isDragging = false;
  }

  getRegionAt(px: number, py: number): string | null {
    const { q, r } = this.pixelToHex(px, py);
    const region = this.regions.find((reg) => reg.q === q && reg.r === r);
    return region?.id ?? null;
  }
}