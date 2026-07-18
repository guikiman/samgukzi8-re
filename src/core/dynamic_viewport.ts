/**
 * [Task 56] 동적 뷰포트 관리 — DynamicViewport
 *
 * 목적: 디바이스 픽셀 비율 대응 및 캔버스 리사이즈 관리.
 *
 * 핵심 로직:
 *   1. devicePixelRatio 기반 스케일 팩터
 *   2. ResizeObserver 자동 감지
 *   3. 디바운스 처리 (100ms)
 */

export type UpscaleQuality = "pixelated" | "low" | "medium" | "high";

export class DynamicViewport {
  private canvas: HTMLCanvasElement | null = null;
  private observer: ResizeObserver | null = null;
  private resizeTimer: ReturnType<typeof setTimeout> | null = null;
  private _width = 0;
  private _height = 0;
  private _scaleFactor = 1;
  private _quality: UpscaleQuality = "high";
  private onResizeCallback: ((w: number, h: number) => void) | null = null;

  /**
   * 뷰포트 초기화
   */
  initialize(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.updateViewport();

    this.observer = new ResizeObserver(() => {
      if (this.resizeTimer) clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => this.updateViewport(), 100);
    });
    this.observer.observe(canvas);
  }

  /**
   * 뷰포트 업데이트 (CSS 크기 + drawing buffer)
   */
  updateViewport(): void {
    if (!this.canvas) return;
    const canvas = this.canvas;

    this._scaleFactor = this.getScaleFactor();
    const cssW = canvas.clientWidth || canvas.width;
    const cssH = canvas.clientHeight || canvas.height;

    const bufW = Math.round(cssW * this._scaleFactor);
    const bufH = Math.round(cssH * this._scaleFactor);

    if (canvas.width !== bufW || canvas.height !== bufH) {
      canvas.width = bufW;
      canvas.height = bufH;
    }

    this._width = cssW;
    this._height = cssH;

    this.setUpscaleQuality(this._quality);
    this.onResizeCallback?.(bufW, bufH);
  }

  /**
   * 스케일 팩터 조회
   */
  get scaleFactor(): number {
    return this._scaleFactor;
  }

  /**
   * 논리적 픽셀 너비
   */
  get width(): number {
    return this._width;
  }

  /**
   * 논리적 픽셀 높이
   */
  get height(): number {
    return this._height;
  }

  /**
   * drawing buffer 너비 (물리 픽셀)
   */
  get bufferWidth(): number {
    return this.canvas?.width ?? 0;
  }

  /**
   * drawing buffer 높이 (물리 픽셀)
   */
  get bufferHeight(): number {
    return this.canvas?.height ?? 0;
  }

  /**
   * 업스케일 품질 설정
   */
  setUpscaleQuality(mode: UpscaleQuality): void {
    this._quality = mode;
    if (!this.canvas) return;

    if (mode === "pixelated") {
      this.canvas.style.imageRendering = "pixelated";
    } else {
      this.canvas.style.imageRendering = "auto";
    }
  }

  /**
   * 리사이즈 콜백 등록
   */
  onResize(callback: (w: number, h: number) => void): void {
    this.onResizeCallback = callback;
  }

  /**
   * 정리
   */
  dispose(): void {
    this.observer?.disconnect();
    this.observer = null;
    if (this.resizeTimer) clearTimeout(this.resizeTimer);
    this.resizeTimer = null;
    this.canvas = null;
    this.onResizeCallback = null;
  }

  private getScaleFactor(): number {
    if (this._quality === "low" || this._quality === "pixelated") return 1;
    const dpr = window.devicePixelRatio || 1;
    if (this._quality === "medium") return Math.min(dpr, 1.5);
    return dpr;
  }
}
