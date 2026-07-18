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

export class ScreenshotCapture {
  private quality = 0.92;
  private format: "image/png" | "image/jpeg" = "image/png";

  /**
   * 스크린샷 캡처 → data URL
   */
  capture(canvas: HTMLCanvasElement): string {
    return canvas.toDataURL(this.format, this.quality);
  }

  /**
   * 스크린샷 캡처 → Blob
   */
  async captureBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("[ScreenshotCapture] Failed to create blob"));
        },
        this.format,
        this.quality,
      );
    });
  }

  /**
   * 게임 + UI 레이어 합성 스크린샷
   */
  captureWithOverlay(gameCanvas: HTMLCanvasElement, uiCanvas: HTMLCanvasElement): string {
    const composite = document.createElement("canvas");
    composite.width = gameCanvas.width;
    composite.height = gameCanvas.height;
    const ctx = composite.getContext("2d");
    if (!ctx) return gameCanvas.toDataURL();

    ctx.drawImage(gameCanvas, 0, 0);
    ctx.drawImage(uiCanvas, 0, 0);
    return composite.toDataURL(this.format, this.quality);
  }

  /**
   * 다운로드 트리거
   */
  async download(canvas: HTMLCanvasElement, filename?: string): Promise<void> {
    const blob = await this.captureBlob(canvas);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename ?? this.generateFilename();
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * 클립보드 복사
   */
  async copyToClipboard(canvas: HTMLCanvasElement): Promise<void> {
    const blob = await this.captureBlob(canvas);
    await navigator.clipboard.write([
      new ClipboardItem({ "image/png": blob }),
    ]);
  }

  /**
   * Web Share API 공유
   */
  async toShareData(canvas: HTMLCanvasElement): Promise<File> {
    const blob = await this.captureBlob(canvas);
    return new File([blob], this.generateFilename(), { type: this.format });
  }

  /**
   * JPEG 품질 설정 (0.0 ~ 1.0)
   */
  setJpegQuality(quality: number): void {
    this.quality = Math.max(0, Math.min(1, quality));
  }

  /**
   * 포맷 설정
   */
  setFormat(format: "image/png" | "image/jpeg"): void {
    this.format = format;
  }

  private generateFilename(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const ext = this.format === "image/png" ? "png" : "jpg";
    return `samkukzi8_${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}.${ext}`;
  }
}
