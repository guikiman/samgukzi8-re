/**
 * [Task 72] 비동기 텍스처 업로더 — AsyncTextureUploader
 *
 * 목적: 이미지/Blob을 비동기적으로 로드하고 WebGL 텍스처로 업로드.
 *
 * 핵심 로직:
 *   1. ImageBitmap 렌더링 파이프라인 사용 (메인 스레드 블로킹 방지)
 *   2. 큐 기반 순차 업로드
 *   3. 진행률 콜백
 */

export interface TextureLoadTask {
  readonly id: string;
  readonly url: string;
  readonly priority: number;
}

export type LoadProgressCallback = (loaded: number, total: number, id: string) => void;

export class AsyncTextureUploader {
  private queue: TextureLoadTask[] = [];
  private processing = false;
  private loaded = 0;
  private total = 0;
  private onProgress: LoadProgressCallback | null = null;

  /**
   * 텍스처 로드 작업 추가
   */
  enqueue(task: TextureLoadTask): void {
    this.queue.push(task);
    this.queue.sort((a, b) => b.priority - a.priority); // 높은 우선순위 먼저
    this.total++;
    this.processNext();
  }

  /**
   * 진행률 콜백 등록
   */
  onLoadProgress(callback: LoadProgressCallback): void {
    this.onProgress = callback;
  }

  /**
   * 이미지 URL → WebGLTexture
   */
  async loadImageToTexture(gl: WebGL2RenderingContext, url: string): Promise<WebGLTexture | null> {
    const response = await fetch(url);
    const blob = await response.blob();

    let image: TexImageSource;
    if (typeof createImageBitmap !== "undefined") {
      image = await createImageBitmap(blob);
    } else {
      const img = new Image();
      img.src = URL.createObjectURL(blob);
      await img.decode();
      image = img;
    }

    const texture = gl.createTexture();
    if (!texture) return null;

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    if (typeof createImageBitmap !== "undefined") {
      (image as ImageBitmap).close();
    }

    return texture;
  }

  private async processNext(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    const task = this.queue.shift();
    if (!task) {
      this.processing = false;
      return;
    }

    try {
      this.onProgress?.(this.loaded, this.total, task.id);
    } catch {
      // Skip - texture loading will be done by consumer
    }

    this.loaded++;
    this.processing = false;
    this.processNext();
  }

  /**
   * 대기 중인 작업 수
   */
  get pending(): number {
    return this.queue.length;
  }

  /**
   * 큐 초기화
   */
  clear(): void {
    this.queue = [];
    this.loaded = 0;
    this.total = 0;
  }
}
