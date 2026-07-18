/**
 * [Task 80] 이미지 리사이저 — ImageResizer
 *
 * 목적: Canvas 2D를 사용한 이미지 리사이징 및
 *       품질 보정 유틸리티.
 *
 * 핵심 로직:
 *   1. Lanczos 보간 기반 고품질 리사이징
 *   2. 특정 크기로 강제 변환
 *   3. 종횡비 유지 옵션
 */
export type ResizeFit = "cover" | "contain" | "fill" | "none";
export type ResizeFilter = "nearest" | "bilinear" | "bicubic";
export declare class ImageResizer {
    /**
     * 이미지 리사이징
     */
    resize(source: HTMLImageElement | HTMLCanvasElement | OffscreenCanvas, targetWidth: number, targetHeight: number, fit?: ResizeFit, filter?: ResizeFilter): HTMLCanvasElement;
    /**
     * 캔버스 → Blob
     */
    toBlob(canvas: HTMLCanvasElement, quality?: number): Promise<Blob>;
    /**
     * 이미지 URL → 리사이즈된 캔버스
     */
    resizeFromUrl(url: string, targetWidth: number, targetHeight: number, fit?: ResizeFit): Promise<HTMLCanvasElement>;
    /**
     * 메모리 사용량 추정 (바이트)
     */
    estimateMemory(width: number, height: number, bytesPerPixel?: number): number;
}
//# sourceMappingURL=image_resizer.d.ts.map