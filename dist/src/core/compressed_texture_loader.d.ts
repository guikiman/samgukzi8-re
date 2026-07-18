/**
 * [Task 71] 압축 텍스처 로더 — CompressedTextureLoader
 *
 * 목적: S3TC/DXT, ETC, ASTC 등 압축 텍스처 포맷을
 *       로드하고 WebGL에 업로드.
 *
 * 핵심 로직:
 *   1. 확장 기능 감지 (WEBGL_compressed_texture_s3tc 등)
 *   2. 압축 데이터 Blob → WebGLTexture 변환
 *   3. 폴백: 압축 미지원 시 PNG/JPEG 로드
 */
export type CompressedFormat = "s3tc" | "etc" | "astc" | "pvrtc";
export declare class CompressedTextureLoader {
    private supportedFormats;
    /**
     * 지원 압축 포맷 감지
     */
    detectSupportedFormats(gl: WebGL2RenderingContext): CompressedFormat[];
    /**
     * 압축 텍스처 업로드
     */
    uploadCompressed(gl: WebGL2RenderingContext, internalFormat: GLenum, width: number, height: number, data: ArrayBufferView): WebGLTexture | null;
    /**
     * Blob URL에서 텍스처 로드 (압축 폴백)
     */
    loadFromBlob(gl: WebGL2RenderingContext, url: string): Promise<WebGLTexture | null>;
    /**
     * 특정 포맷 지원 여부
     */
    isFormatSupported(format: CompressedFormat): boolean;
}
//# sourceMappingURL=compressed_texture_loader.d.ts.map