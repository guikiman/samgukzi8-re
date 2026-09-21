/**
 * [Phase 3] Canvas2D 헥사곤 맵 렌더러 — HexMapCanvasRenderer
 *
 * WebGL 없이 Canvas2D로 헥사곤 지도를 60fps 렌더링.
 * Axial 좌표계(q, r) 기반, 지형/도시/포그 렌더링.
 */
// ============================================================
// Hex axial → pixel conversion
// ============================================================
export function hexToPixel(q, r, size) {
    const x = size * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r);
    const y = size * (3 / 2 * r);
    return { x, y };
}
export function pixelToHex(px, py, size) {
    const q = (Math.sqrt(3) / 3 * px - 1 / 3 * py) / size;
    const r = (2 / 3 * py) / size;
    // Round to nearest hex
    return hexRound(q, r);
}
function hexRound(q, r) {
    const s = -q - r;
    let rq = Math.round(q);
    let rr = Math.round(r);
    const rs = Math.round(s);
    const dq = Math.abs(rq - q);
    const dr = Math.abs(rr - r);
    const ds = Math.abs(rs - s);
    if (dq > dr && dq > ds)
        rq = -rr - rs;
    else if (dr > ds)
        rr = -rq - rs;
    return { q: rq, r: rr };
}
// ============================================================
// Hex corner positions (flat-top)
// ============================================================
function hexCorners(cx, cy, size) {
    const corners = [];
    for (let i = 0; i < 6; i++) {
        const angle = Math.PI / 180 * (60 * i - 30);
        corners.push([cx + size * Math.cos(angle), cy + size * Math.sin(angle)]);
    }
    return corners;
}
const TERRAIN_STYLES = {
    plain: { fill: '#c8d8a0', stroke: '#8a9a60', labelColor: '#4a5a20' },
    forest: { fill: '#3a7a3a', stroke: '#2a5a2a', labelColor: '#c8e8c8' },
    mountain: { fill: '#8a8a7a', stroke: '#5a5a4a', labelColor: '#e8e8d8' },
    water: { fill: '#5a8aba', stroke: '#3a6a9a', labelColor: '#d8e8f8' },
    swamp: { fill: '#7a9a6a', stroke: '#5a7a4a', labelColor: '#c8d8b8' },
    desert: { fill: '#e8d8a0', stroke: '#c8b870', labelColor: '#8a7a40' },
    snow: { fill: '#e8e8f0', stroke: '#c8c8d8', labelColor: '#8888a0' },
    road: { fill: '#b8a888', stroke: '#8a7a68', labelColor: '#5a4a38' },
    wall: { fill: '#8a8a98', stroke: '#5a5a68', labelColor: '#c8c8d8' },
    city: { fill: '#c8a060', stroke: '#8a7030', labelColor: '#4a3000' },
    farm: { fill: '#b8d888', stroke: '#8ab858', labelColor: '#4a7a28' },
    market: { fill: '#d8b888', stroke: '#b89858', labelColor: '#6a5020' },
    barracks: { fill: '#b8a8a8', stroke: '#8a7878', labelColor: '#4a3838' },
    port: { fill: '#88a8c8', stroke: '#587898', labelColor: '#284868' },
};
// ============================================================
// HexMapCanvasRenderer
// ============================================================
export class HexMapCanvasRenderer {
    constructor(canvas) {
        this.hexSize = 30;
        this.offsetX = 0;
        this.offsetY = 0;
        this.zoom = 1.0;
        this.hoveredHex = null;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }
    setView(view) {
        if (view.hexSize !== undefined)
            this.hexSize = view.hexSize;
        if (view.offsetX !== undefined)
            this.offsetX = view.offsetX;
        if (view.offsetY !== undefined)
            this.offsetY = view.offsetY;
        if (view.zoom !== undefined)
            this.zoom = view.zoom;
    }
    setHoveredHex(hex) {
        this.hoveredHex = hex;
    }
    render(tiles, width, height) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, width, height);
        // Background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, width, height);
        const size = this.hexSize * this.zoom;
        const cx = width / 2 + this.offsetX;
        const cy = height / 2 + this.offsetY;
        // Sort tiles: render from back to front
        const sorted = [...tiles].sort((a, b) => (a.r + a.q) - (b.r + b.q));
        for (const tile of sorted) {
            const pos = hexToPixel(tile.q, tile.r, size);
            const sx = cx + pos.x;
            const sy = cy + pos.y;
            // Skip off-screen
            const margin = size * 2;
            if (sx < -margin || sx > width + margin || sy < -margin || sy > height + margin)
                continue;
            this.drawHexTile(ctx, sx, sy, size, tile);
        }
    }
    drawHexTile(ctx, cx, cy, size, tile) {
        const corners = hexCorners(cx, cy, size);
        // Terrain fill
        const style = TERRAIN_STYLES[tile.terrain] ?? TERRAIN_STYLES.plain;
        if (tile.isFogged) {
            ctx.fillStyle = '#1a1a2e';
            ctx.strokeStyle = '#2a2a3e';
        }
        else if (!tile.isExplored && tile.isExplored !== undefined) {
            ctx.fillStyle = '#2a2a3e';
            ctx.strokeStyle = '#3a3a4e';
        }
        else {
            // Base terrain
            ctx.fillStyle = style.fill;
            ctx.strokeStyle = style.stroke;
        }
        // Draw hex path
        ctx.beginPath();
        ctx.moveTo(corners[0][0], corners[0][1]);
        for (let i = 1; i < 6; i++) {
            ctx.lineTo(corners[i][0], corners[i][1]);
        }
        ctx.closePath();
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.stroke();
        // Ownership color overlay
        if (tile.ownerColor && !tile.isFogged) {
            ctx.fillStyle = tile.ownerColor + '30'; // semi-transparent
            ctx.fill();
            // Color band on top
            ctx.fillStyle = tile.ownerColor;
            ctx.fillRect(cx - size * 0.4, cy - size * 0.7, size * 0.8, 3);
        }
        // Selection highlight
        if (tile.isSelected) {
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 2.5;
            ctx.stroke();
        }
        // Hover highlight
        if (this.hoveredHex && this.hoveredHex.q === tile.q && this.hoveredHex.r === tile.r) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        // Label
        if (tile.label && !tile.isFogged) {
            ctx.fillStyle = style.labelColor;
            ctx.font = `bold ${Math.max(9, size * 0.35)}px "Malgun Gothic", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(tile.label, cx, cy);
        }
    }
    /**
     * 화면 픽셀 좌표 → 헥스 좌표 변환
     */
    screenToHex(px, py) {
        const size = this.hexSize * this.zoom;
        const cx = this.canvas.width / 2 + this.offsetX;
        const cy = this.canvas.height / 2 + this.offsetY;
        const dx = px - cx;
        const dy = py - cy;
        return pixelToHex(dx, dy, size);
    }
    /**
     * 드래그로 뷰 이동
     */
    pan(dx, dy) {
        this.offsetX += dx;
        this.offsetY += dy;
    }
    /**
     * 줌 인/아웃
     */
    zoomAt(factor, centerPx, centerPy) {
        const hex = this.screenToHex(centerPx, centerPy);
        const oldZoom = this.zoom;
        this.zoom = Math.max(0.3, Math.min(3.0, this.zoom * factor));
        // Keep the hex under cursor stable
        const size = this.hexSize * this.zoom;
        const oldSize = this.hexSize * oldZoom;
        const pos = hexToPixel(hex.q, hex.r, size);
        const oldPos = hexToPixel(hex.q, hex.r, oldSize);
        const cx = this.canvas.width / 2 + this.offsetX;
        const cy = this.canvas.height / 2 + this.offsetY;
        this.offsetX += (oldPos.x - pos.x);
        this.offsetY += (oldPos.y - pos.y);
    }
    getState() {
        return { offsetX: this.offsetX, offsetY: this.offsetY, zoom: this.zoom, hexSize: this.hexSize };
    }
}
//# sourceMappingURL=hex_map_canvas_renderer.js.map