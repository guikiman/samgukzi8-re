/**
 * [Task 63] 스크린샷 캡처 — ScreenshotCapture
 *
 * 목적: 게임 캔버스 스크린샷 캡처 및 다운로드/클립보드 저장.
 *
 * 핵심 로직:
 *   1. Canvas → PNG/JPEG data URL 변환
 *   2. 게임 + UI 레이어 합성
 *   3. Web Share API / Clipboard API 지원
 */
export declare class ScreenshotCapture {
    private quality;
    private format;
    /**
     * 스크린샷 캡처 → data URL
     */
    capture(canvas: HTMLCanvasElement): string;
    /**
     * 스크린샷 캡처 → Blob
     */
    captureBlob(canvas: HTMLCanvasElement): Promise<Blob>;
    /**
     * 게임 + UI 레이어 합성 스크린샷
     */
    captureWithOverlay(gameCanvas: HTMLCanvasElement, uiCanvas: HTMLCanvasElement): string;
    /**
     * 다운로드 트리거
     */
    download(canvas: HTMLCanvasElement, filename?: string): Promise<void>;
    /**
     * 클립보드 복사
     */
    copyToClipboard(canvas: HTMLCanvasElement): Promise<void>;
    /**
     * Web Share API 공유
     */
    toShareData(canvas: HTMLCanvasElement): Promise<File>;
    /**
     * JPEG 품질 설정 (0.0 ~ 1.0)
     */
    setJpegQuality(quality: number): void;
    /**
     * 포맷 설정
     */
    setFormat(format: "image/png" | "image/jpeg"): void;
    private generateFilename;
}
//# sourceMappingURL=screenshot_capture.d.ts.map