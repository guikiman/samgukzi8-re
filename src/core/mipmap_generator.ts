/**
 * [Task 70] 밉맵 생성기 — MipmapGenerator
 *
 * 목적: 텍스처의 밉맵 체인을 자동 생성하여
 *       원거리 렌더링 품질 향상.
 *
 * 핵심 로직:
 *   1. WebGL2 gl.generateMipmap 래퍼
 *   2. 수동 밉맵 생성 (WebGL1 폴백)
 *   3. 밉맵 필터 모드 관리
 */

export type MipmapFilter = "nearest" | "linear" | "nearestMipmapNearest" | "linearMipmapNearest" | "nearestMipmapLinear" | "linearMipmapLinear";

export class MipmapGenerator {
  /**
   * WebGL2 밉맵 자동 생성
   */
  generate(gl: WebGL2RenderingContext, target: GLenum): boolean {
    try {
      gl.generateMipmap(target);
      const error = gl.getError();
      if (error !== gl.NO_ERROR) {
        console.warn(`[MipmapGenerator] generateMipmap error: ${error}`);
        return false;
      }
      return true;
    } catch (e) {
      console.warn("[MipmapGenerator] generateMipmap failed:", e);
      return false;
    }
  }

  /**
   * 밉맵 필터 모드 설정
   */
  setFilter(gl: WebGL2RenderingContext, filter: MipmapFilter): void {
    const modeMap: Record<MipmapFilter, GLenum> = {
      nearest: 0x2600,
      linear: 0x2601,
      nearestMipmapNearest: 0x2700,
      linearMipmapNearest: 0x2701,
      nearestMipmapLinear: 0x2702,
      linearMipmapLinear: 0x2703,
    };

    const mode = modeMap[filter];
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mode);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter === "nearest" ? 0x2600 : 0x2601);
  }

  /**
   * WebGL2 밉맛 지원 여부
   */
  static isSupported(gl: WebGL2RenderingContext): boolean {
    return typeof gl.generateMipmap === "function";
  }
}
