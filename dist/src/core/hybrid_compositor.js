/**
 * [Task 64] 하이브리드 컴포지터 — HybridCompositor
 *
 * 목적: Canvas 2D 메인 렌더러와 WebGL 오버레이를 합성.
 *
 * 핵심 로직:
 *   1. 메인 캔버스 (Canvas 2D): UI, 텍스트, 스프라이트
 *   2. 오버레이 캔버스 (WebGL2): 파티클, 셰이더, 포스트 프로세싱
 *   3. 오버레이는 absolute 포지셔닝 + pointer-events: none
 */
export class HybridCompositor {
    constructor() {
        this.mainCanvas = null;
        this.overlayCanvas = null;
        this.mainCtx = null;
        this.glOverlayCtx = null;
    }
    /**
     * 초기화
     */
    initialize(mainCanvas, overlayCanvas) {
        this.mainCanvas = mainCanvas;
        this.overlayCanvas = overlayCanvas;
        this.mainCtx = mainCanvas.getContext("2d");
        if (!this.mainCtx) {
            console.warn("[HybridCompositor] Canvas 2D not available");
            return false;
        }
        this.glOverlayCtx = overlayCanvas.getContext("webgl2", {
            alpha: true,
            premultipliedAlpha: false,
            preserveDrawingBuffer: false,
        });
        if (!this.glOverlayCtx) {
            console.warn("[HybridCompositor] WebGL2 overlay not available");
        }
        // CSS setup
        overlayCanvas.style.position = "absolute";
        overlayCanvas.style.top = "0";
        overlayCanvas.style.left = "0";
        overlayCanvas.style.pointerEvents = "none";
        overlayCanvas.style.zIndex = "10";
        return true;
    }
    /**
     * 프레임 합성
     */
    compositeFrame() {
        // Main layer already drawn, overlay is composited via WebGL
        if (!this.glOverlayCtx || !this.overlayCanvas)
            return;
        // The WebGL overlay is already rendered in its own context
        // No additional compositing needed since overlay is positioned on top
    }
    /**
     * 메인 Canvas 2D 컨텍스트
     */
    getMainContext() {
        if (!this.mainCtx)
            throw new Error("[HybridCompositor] Not initialized");
        return this.mainCtx;
    }
    /**
     * WebGL 오버레이 컨텍스트
     */
    getGlOverlay() {
        return this.glOverlayCtx;
    }
    /**
     * 레이어 불투명도 설정
     */
    setOpacity(layer, alpha) {
        const el = layer === "main" ? this.mainCanvas : this.overlayCanvas;
        if (el)
            el.style.opacity = String(alpha);
    }
    /**
     * 레이어 가시성 설정
     */
    setVisibility(layer, visible) {
        const el = layer === "main" ? this.mainCanvas : this.overlayCanvas;
        if (el)
            el.style.visibility = visible ? "visible" : "hidden";
    }
    /**
     * 리사이즈
     */
    resize(width, height) {
        if (this.mainCanvas) {
            this.mainCanvas.width = width;
            this.mainCanvas.height = height;
        }
        if (this.overlayCanvas) {
            this.overlayCanvas.width = width;
            this.overlayCanvas.height = height;
        }
    }
    /**
     * 레이어 조회
     */
    get layers() {
        const layers = [];
        if (this.mainCanvas && this.mainCtx) {
            layers.push({ canvas: this.mainCanvas, ctx: this.mainCtx, type: "2d" });
        }
        if (this.overlayCanvas && this.glOverlayCtx) {
            layers.push({ canvas: this.overlayCanvas, ctx: this.glOverlayCtx, type: "webgl" });
        }
        return layers;
    }
    /**
     * 정리
     */
    dispose() {
        this.mainCanvas = null;
        this.overlayCanvas = null;
        this.mainCtx = null;
        this.glOverlayCtx = null;
    }
}
//# sourceMappingURL=hybrid_compositor.js.map