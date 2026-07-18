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
export declare class AsyncTextureUploader {
    private queue;
    private processing;
    private loaded;
    private total;
    private onProgress;
    /**
     * 텍스처 로드 작업 추가
     */
    enqueue(task: TextureLoadTask): void;
    /**
     * 진행률 콜백 등록
     */
    onLoadProgress(callback: LoadProgressCallback): void;
    /**
     * 이미지 URL → WebGLTexture
     */
    loadImageToTexture(gl: WebGL2RenderingContext, url: string): Promise<WebGLTexture | null>;
    private processNext;
    /**
     * 대기 중인 작업 수
     */
    get pending(): number;
    /**
     * 큐 초기화
     */
    clear(): void;
}
//# sourceMappingURL=async_texture_uploader.d.ts.map