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
export declare class DynamicViewport {
    private canvas;
    private observer;
    private resizeTimer;
    private _width;
    private _height;
    private _scaleFactor;
    private _quality;
    private onResizeCallback;
    /**
     * 뷰포트 초기화
     */
    initialize(canvas: HTMLCanvasElement): void;
    /**
     * 뷰포트 업데이트 (CSS 크기 + drawing buffer)
     */
    updateViewport(): void;
    /**
     * 스케일 팩터 조회
     */
    get scaleFactor(): number;
    /**
     * 논리적 픽셀 너비
     */
    get width(): number;
    /**
     * 논리적 픽셀 높이
     */
    get height(): number;
    /**
     * drawing buffer 너비 (물리 픽셀)
     */
    get bufferWidth(): number;
    /**
     * drawing buffer 높이 (물리 픽셀)
     */
    get bufferHeight(): number;
    /**
     * 업스케일 품질 설정
     */
    setUpscaleQuality(mode: UpscaleQuality): void;
    /**
     * 리사이즈 콜백 등록
     */
    onResize(callback: (w: number, h: number) => void): void;
    /**
     * 정리
     */
    dispose(): void;
    private getScaleFactor;
}
//# sourceMappingURL=dynamic_viewport.d.ts.map