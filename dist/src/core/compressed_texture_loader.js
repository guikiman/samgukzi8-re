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
export class CompressedTextureLoader {
    constructor() {
        this.supportedFormats = new Set();
    }
    /**
     * 지원 압축 포맷 감지
     */
    detectSupportedFormats(gl) {
        this.supportedFormats.clear();
        const exts = gl.getSupportedExtensions() ?? [];
        if (exts.includes("WEBGL_compressed_texture_s3tc"))
            this.supportedFormats.add("s3tc");
        if (exts.includes("WEBGL_compressed_texture_etc"))
            this.supportedFormats.add("etc");
        if (exts.includes("WEBGL_compressed_texture_astc"))
            this.supportedFormats.add("astc");
        if (exts.includes("WEBGL_compressed_texture_pvrtc"))
            this.supportedFormats.add("pvrtc");
        return Array.from(this.supportedFormats);
    }
    /**
     * 압축 텍스처 업로드
     */
    uploadCompressed(gl, internalFormat, width, height, data) {
        const texture = gl.createTexture();
        if (!texture)
            return null;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        try {
            gl.compressedTexImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, data);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }
        catch (e) {
            console.warn("[CompressedTextureLoader] Upload failed:", e);
            gl.deleteTexture(texture);
            return null;
        }
        return texture;
    }
    /**
     * Blob URL에서 텍스처 로드 (압축 폴백)
     */
    async loadFromBlob(gl, url) {
        const img = new Image();
        img.src = url;
        await img.decode();
        const texture = gl.createTexture();
        if (!texture)
            return null;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        URL.revokeObjectURL(url);
        return texture;
    }
    /**
     * 특정 포맷 지원 여부
     */
    isFormatSupported(format) {
        return this.supportedFormats.has(format);
    }
}
//# sourceMappingURL=compressed_texture_loader.js.map