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

export class InstancedRenderer {
  private gl: WebGL2RenderingContext | null = null;
  private ext: { drawArraysInstanced?: Function; vertexAttribDivisor?: Function } | null = null;
  private version: 1 | 2 = 2;
  private initialized = false;

  initialize(gl: WebGL2RenderingContext): boolean {
    this.gl = gl;
    this.version = 2;
    this.initialized = true;
    return true;
  }

  initializeWebGL1(gl: WebGLRenderingContext): boolean {
    const ext = gl.getExtension("ANGLE_instanced_arrays");
    if (!ext) {
      console.warn("[InstancedRenderer] ANGLE_instanced_arrays not supported");
      return false;
    }
    this.gl = gl as unknown as WebGL2RenderingContext;
    this.ext = ext as unknown as { drawArraysInstanced?: Function; vertexAttribDivisor?: Function };
    this.version = 1;
    this.initialized = true;
    return true;
  }

  get isReady(): boolean {
    return this.initialized;
  }

  /**
   * Instance attribute 설정
   */
  setInstanceAttribute(
    gl: WebGL2RenderingContext,
    buffer: WebGLBuffer,
    location: number,
    size: number,
    stride: number,
    divisor: number,
  ): void {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, stride, 0);

    if (this.version === 2) {
      gl.vertexAttribDivisor(location, divisor);
    } else {
      (gl as unknown as { vertexAttribDivisor?: Function }).vertexAttribDivisor?.(location, divisor);
    }
  }

  /**
   * Instanced 렌더링 실행
   */
  renderInstanced(vao: WebGLVertexArrayObject, vertexCount: number, instanceCount: number): void {
    if (!this.gl) return;
    const gl = this.gl;

    gl.bindVertexArray(vao);

    if (this.version === 2) {
      gl.drawArraysInstanced(gl.TRIANGLES, 0, vertexCount, instanceCount);
    } else {
      (gl as unknown as { drawArraysInstanced?: Function }).drawArraysInstanced?.(
        gl.TRIANGLES, 0, vertexCount, instanceCount,
      );
    }

    gl.bindVertexArray(null);
  }

  /**
   * 헥사곤 타일 배치 렌더링
   */
  batchRenderHexTiles(
    hexData: Float32Array,
    colorData: Float32Array,
    vertexCount: number,
  ): void {
    if (!this.gl || !this.initialized) return;
    const gl = this.gl;
    const instanceCount = hexData.length / 3;

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, hexData, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

    const colBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colorData, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

    if (this.version === 2) {
      gl.vertexAttribDivisor(0, 1);
      gl.vertexAttribDivisor(1, 1);
    }

    gl.bindVertexArray(null);

    if (this.version === 2) {
      gl.drawArraysInstanced(gl.TRIANGLES, 0, vertexCount, instanceCount);
    }

    gl.deleteVertexArray(vao);
    gl.deleteBuffer(posBuffer);
    gl.deleteBuffer(colBuffer);
  }

  dispose(): void {
    this.gl = null;
    this.ext = null;
    this.initialized = false;
  }
}
