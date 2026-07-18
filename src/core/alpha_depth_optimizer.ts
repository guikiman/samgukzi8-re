/**
 * [Task 58] 알파 블렌딩 및 깊이 테스트 최적화 — AlphaDepthOptimizer
 *
 * 목적: 투명 오브젝트의 알파 블렌딩 모드 관리 및 깊이 쓰기 최적화.
 *
 * 핵심 로직:
 *   1. 불투명/투명 오브젝트 분리 배치
 *   2. 카메라 거리 기반 투명 오브젝트 정렬 (back-to-front)
 *   3. 블렌드 모드 전환 (normal / additive / multiply / screen)
 */

export type AlphaBlendMode = "normal" | "additive" | "multiply" | "screen";

export interface Renderable {
  readonly depth: number;
  readonly opaque: boolean;
  readonly id: string;
  readonly customSortKey?: number;
}

export interface AlphaBlendState {
  readonly src: GLenum;
  readonly dst: GLenum;
  readonly equation: GLenum;
}

const BLEND_STATES: Record<AlphaBlendMode, AlphaBlendState> = {
  normal:     { src: 0x0302, dst: 0x0303, equation: 0x8006 }, // SRC_ALPHA, ONE_MINUS_SRC_ALPHA, FUNC_ADD
  additive:   { src: 0x0302, dst: 0x0001, equation: 0x8006 }, // SRC_ALPHA, ONE, FUNC_ADD
  multiply:   { src: 0x0300, dst: 0x0303, equation: 0x8006 }, // ZERO, ONE_MINUS_SRC_ALPHA, FUNC_ADD → dst * src
  screen:     { src: 0x0001, dst: 0x0001, equation: 0x8006 }, // ONE, ONE, FUNC_ADD
};

export class AlphaDepthOptimizer {
  private currentMode: AlphaBlendMode = "normal";

  /**
   * 불투명/투명 오브젝트 분리
   */
  batchOpaqueFirst(renderables: readonly Renderable[]): { opaque: Renderable[]; transparent: Renderable[] } {
    const opaque: Renderable[] = [];
    const transparent: Renderable[] = [];

    for (const r of renderables) {
      if (r.opaque) opaque.push(r);
      else transparent.push(r);
    }

    return { opaque, transparent };
  }

  /**
   * 투명 오브젝트 Back-to-Front 정렬 (카메라 거리 기준)
   */
  sortTransparent(renderables: readonly Renderable[], cameraPos: { x: number; y: number; z: number }): Renderable[] {
    return [...renderables].sort((a, b) => {
      if (a.customSortKey !== undefined && b.customSortKey !== undefined) {
        return a.customSortKey - b.customSortKey;
      }
      return b.depth - a.depth;
    });
  }

  /**
   * 깊이 쓰기 활성화/비활성화
   */
  setDepthWrite(gl: WebGL2RenderingContext, enable: boolean): void {
    gl.depthMask(enable);
  }

  /**
   * 블렌드 모드 설정
   */
  setBlendMode(gl: WebGL2RenderingContext, mode: AlphaBlendMode): void {
    if (mode === this.currentMode) return;

    const state = BLEND_STATES[mode];
    gl.blendFunc(state.src, state.dst);
    gl.blendEquation(state.equation);
    this.currentMode = mode;

    if (mode === "normal" || mode === "additive") {
      gl.enable(gl.BLEND);
    } else {
      gl.enable(gl.BLEND);
    }
  }

  /**
   * 현재 블렌드 모드
   */
  get mode(): AlphaBlendMode {
    return this.currentMode;
  }
}
