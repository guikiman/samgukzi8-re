/**
 * [1] GPU 가속 KTX2 텍스처 스트리밍
 *
 * Khronos Group 표준 KTX2 포맷 + Basis Universal 트랜스코더를
 * Web Worker에서 로드, GPU VRAM에 압축 상태로 다이렉트 업로드.
 * 데스크톱(BC7) / 모바일(ASTC) 런타임 디코딩 대응.
 *
 * TextureStreamingManager:
 *   - loadKTX2(): KTX2 파일 로드 + Web Worker 트랜스코딩
 *   - uploadToGPU(): GPU 텍스처 버퍼 다이렉트 업로드
 *   - determineFormat(): GPU 사양에 맞는 포맷 자동 선택
 */
export type GPUFormat = 'BC7' | 'ASTC' | 'ETC2' | 'RGBA8';
export interface TextureStreamingOptions {
    readonly maxResolution: number;
    readonly streamingThreshold: number;
    readonly workerPoolSize: number;
    readonly preferredFormat: GPUFormat;
}
export interface TextureStreamingState {
    loadedTextures: number;
    bytesTransferred: number;
    activeStreams: number;
    readonly format: GPUFormat;
    readonly isMobile: boolean;
}
export declare class TextureStreamingManager {
    private options;
    private state;
    private worker;
    private loadQueue;
    private activeLoads;
    constructor(options?: Partial<TextureStreamingOptions>);
    /**
     * [1] KTX2 파일 로드 + Web Worker 트랜스코딩
     * GPU 포맷(BC7/ASTC)으로 런타임 디코딩
     */
    loadKTX2(url: string): Promise<ArrayBuffer | null>;
    private _loadInternal;
    /**
     * [1] Basis Universal 트랜스코딩 (Web Worker)
     * KTX2 → BC7/ASTC/ETC2 런타임 변환
     */
    private transcodeBasisUniversal;
    /**
     * [1] GPU 텍스처 버퍼에 다이렉트 업로드
     * WebGL compressedTexImage2D로 VRAM 직접 전송
     */
    uploadToGPU(gl: WebGL2RenderingContext, data: ArrayBuffer, width: number, height: number): WebGLTexture | null;
    getState(): TextureStreamingState;
    getFormat(): GPUFormat;
    dispose(): void;
}
//# sourceMappingURL=texture_streaming_manager.d.ts.map