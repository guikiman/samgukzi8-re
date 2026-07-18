/**
 * [Task 52] WebGL2 초기화 및 폴백 — WebGL2InitFallback
 *
 * 목적: WebGL2 컨텍스트 생성 시 WebGL1로 자동 폴백.
 *
 * 핵심 로직:
 *   1. WebGL2 우선 시도, 실패 시 WebGL1
 *   2. 확장 기능 지원 여부 확인 헬퍼
 */

export type WebGLContext = WebGL2RenderingContext | WebGLRenderingContext;

export class WebGL2InitFallback {
  /**
   * WebGL 컨텍스트 생성 (WebGL2 → WebGL1 폴백)
   */
  static createContext(
    canvas: HTMLCanvasElement,
    options?: WebGLContextAttributes,
  ): WebGLContext | null {
    let gl: WebGLContext | null = canvas.getContext("webgl2", options) as WebGL2RenderingContext | null;
    if (gl) return gl;

    gl = canvas.getContext("webgl", options) as WebGLRenderingContext | null;
    if (gl) return gl;

    console.warn("[WebGL2InitFallback] WebGL not supported");
    return null;
  }

  /**
   * 컨텍스트 버전 반환 (2 또는 1)
   */
  static getContextVersion(gl: WebGLContext): 1 | 2 {
    return (gl as WebGL2RenderingContext).drawArraysInstanced !== undefined ? 2 : 1;
  }

  /**
   * 확장 기능 지원 여부 확인
   */
  static supportsExtension(gl: WebGLContext, ext: string): boolean {
    return !!gl.getExtension(ext);
  }

  /**
   * WebGL2 사용 가능 여부 확인 (컨텍스트 생성 없이)
   */
  static isWebGL2Supported(): boolean {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2");
    const supported = !!gl;
    if (gl) {
      const lose = gl.getExtension("WEBGL_lose_context");
      lose?.loseContext();
    }
    return supported;
  }
}
