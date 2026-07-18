/**
 * [Task 77] 아틀라스 디버그 오버레이 — AtlasDebugOverlay
 *
 * 목적: 텍스처 아틀라스의 사용 현황을 시각적으로
 *       디버깅하는 오버레이.
 *
 * 핵심 로직:
 *   1. 아틀라스 텍스처 위에 리전 경계선 그리기
 *   2. 사용률, 리전 수, 단편화율 표시
 */
export class AtlasDebugOverlay {
    constructor() {
        this.canvas = null;
        this.ctx = null;
    }
    /**
     * 디버그 캔버스 초기화
     */
    initialize(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
    }
    /**
     * 아틀라스 오버레이 렌더링
     */
    render(regions, stats, atlasTexture) {
        if (!this.ctx || !this.canvas)
            return;
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        ctx.clearRect(0, 0, w, h);
        // 통계 텍스트
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, 300, 80);
        ctx.fillStyle = "#0f0";
        ctx.font = "12px monospace";
        ctx.fillText(`Atlas: ${stats.atlasWidth}x${stats.atlasHeight}`, 8, 16);
        ctx.fillText(`Regions: ${stats.usedRegions}`, 8, 32);
        ctx.fillText(`Free ratio: ${(stats.freeRatio * 100).toFixed(1)}%`, 8, 48);
        ctx.fillText(`Memory: ${stats.totalMemoryKB}KB`, 8, 64);
        // 리전 경계선
        ctx.strokeStyle = "rgba(255, 255, 0, 0.5)";
        ctx.lineWidth = 1;
        const scaleX = w / stats.atlasWidth;
        const scaleY = h / stats.atlasHeight;
        for (const region of regions) {
            const x = region.u * w;
            const y = region.v * h;
            const rw = region.w * w;
            const rh = region.h * h;
            ctx.strokeRect(x, y, rw, rh);
            ctx.fillStyle = "rgba(255, 255, 0, 0.3)";
            ctx.font = "8px monospace";
            ctx.fillText(region.name.substring(0, 8), x + 2, y + 10);
        }
    }
    /**
     * 오버레이 초기화
     */
    clear() {
        if (!this.ctx || !this.canvas)
            return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}
//# sourceMappingURL=atlas_debug_overlay.js.map