/**
 * [Task 53] Instanced Rendering 엔진 — InstancedRenderer
 *
 * 목적: 헥사곤 타일 배치 드로잉을 위한 GPU instanced rendering.
 *
 * 핵심 로직:
 *   1. WebGL2 instanced draw (drawArraysInstanced)
 *   2. divisor 기반 instance attribute 설정
 *   3. WebGL1 폴백 (ANGLE_instanced_arrays 확장)
 */
export declare class InstancedRenderer {
    private gl;
    private ext;
    private version;
    private initialized;
    initialize(gl: WebGL2RenderingContext): boolean;
    initializeWebGL1(gl: WebGLRenderingContext): boolean;
    get isReady(): boolean;
    /**
     * Instance attribute 설정
     */
    setInstanceAttribute(gl: WebGL2RenderingContext, buffer: WebGLBuffer, location: number, size: number, stride: number, divisor: number): void;
    /**
     * Instanced 렌더링 실행
     */
    renderInstanced(vao: WebGLVertexArrayObject, vertexCount: number, instanceCount: number): void;
    /**
     * 헥사곤 타일 배치 렌더링
     */
    batchRenderHexTiles(hexData: Float32Array, colorData: Float32Array, vertexCount: number): void;
    dispose(): void;
}
//# sourceMappingURL=instanced_renderer.d.ts.map