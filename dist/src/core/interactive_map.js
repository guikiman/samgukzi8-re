export class InteractiveMap {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.offsetX = 0;
        this.offsetY = 0;
        this.scale = 1;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.hexRadius = 20;
        this.regions = [];
    }
    attach(canvas, width, height) {
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
    setRegions(regions) {
        this.regions = regions;
    }
    render() {
        const ctx = this.ctx;
        if (!ctx || !this.canvas)
            return;
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
    drawHex(ctx, q, r, color) {
        const { x, y } = this.hexToPixel(q, r);
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6;
            const px = x + this.hexRadius * Math.cos(angle);
            const py = y + this.hexRadius * Math.sin(angle);
            if (i === 0)
                ctx.moveTo(px, py);
            else
                ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = "#2c3e50";
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    drawHexLabel(ctx, q, r, name) {
        const { x, y } = this.hexToPixel(q, r);
        ctx.fillStyle = "#fff";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(name, x, y);
    }
    hexToPixel(q, r) {
        const x = this.hexRadius * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
        const y = this.hexRadius * (1.5 * r);
        return { x, y };
    }
    pixelToHex(px, py) {
        const adjustedX = (px - this.offsetX) / this.scale;
        const adjustedY = (py - this.offsetY) / this.scale;
        const q = ((Math.sqrt(3) / 3) * adjustedX - (1 / 3) * adjustedY) / this.hexRadius;
        const r = ((2 / 3) * adjustedY) / this.hexRadius;
        return { q: Math.round(q), r: Math.round(r) };
    }
    onZoom(e) {
        e.preventDefault();
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        this.scale = Math.max(0.3, Math.min(3, this.scale * zoomFactor));
        this.render();
    }
    onDragStart(e) {
        this.isDragging = true;
        this.dragStartX = e.clientX - this.offsetX;
        this.dragStartY = e.clientY - this.offsetY;
    }
    onDragMove(e) {
        if (!this.isDragging)
            return;
        this.offsetX = e.clientX - this.dragStartX;
        this.offsetY = e.clientY - this.dragStartY;
        this.render();
    }
    onDragEnd() {
        this.isDragging = false;
    }
    getRegionAt(px, py) {
        const { q, r } = this.pixelToHex(px, py);
        const region = this.regions.find((reg) => reg.q === q && reg.r === r);
        return region?.id ?? null;
    }
}
//# sourceMappingURL=interactive_map.js.map