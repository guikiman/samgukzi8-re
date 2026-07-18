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

export interface CompositeLayer {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D | WebGL2RenderingContext;
  readonly type: "2d" | "webgl";
}

export class HybridCompositor {
  private mainCanvas: HTMLCanvasElement | null = null;
  private overlayCanvas: HTMLCanvasElement | null = null;
  private mainCtx: CanvasRenderingContext2D | null = null;
  private glOverlayCtx: WebGL2RenderingContext | null = null;

  /**
   * 초기화
   */
  initialize(mainCanvas: HTMLCanvasElement, overlayCanvas: HTMLCanvasElement): boolean {
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
    }) as WebGL2RenderingContext | null;

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
  compositeFrame(): void {
    // Main layer already drawn, overlay is composited via WebGL
    if (!this.glOverlayCtx || !this.overlayCanvas) return;
    // The WebGL overlay is already rendered in its own context
    // No additional compositing needed since overlay is positioned on top
  }

  /**
   * 메인 Canvas 2D 컨텍스트
   */
  getMainContext(): CanvasRenderingContext2D {
    if (!this.mainCtx) throw new Error("[HybridCompositor] Not initialized");
    return this.mainCtx;
  }

  /**
   * WebGL 오버레이 컨텍스트
   */
  getGlOverlay(): WebGL2RenderingContext | null {
    return this.glOverlayCtx;
  }

  /**
   * 레이어 불투명도 설정
   */
  setOpacity(layer: "main" | "overlay", alpha: number): void {
    const el = layer === "main" ? this.mainCanvas : this.overlayCanvas;
    if (el) el.style.opacity = String(alpha);
  }

  /**
   * 레이어 가시성 설정
   */
  setVisibility(layer: "main" | "overlay", visible: boolean): void {
    const el = layer === "main" ? this.mainCanvas : this.overlayCanvas;
    if (el) el.style.visibility = visible ? "visible" : "hidden";
  }

  /**
   * 리사이즈
   */
  resize(width: number, height: number): void {
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
  get layers(): CompositeLayer[] {
    const layers: CompositeLayer[] = [];
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
  dispose(): void {
    this.mainCanvas = null;
    this.overlayCanvas = null;
    this.mainCtx = null;
    this.glOverlayCtx = null;
  }
}
