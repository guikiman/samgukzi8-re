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
const BLEND_STATES = {
    normal: { src: 0x0302, dst: 0x0303, equation: 0x8006 }, // SRC_ALPHA, ONE_MINUS_SRC_ALPHA, FUNC_ADD
    additive: { src: 0x0302, dst: 0x0001, equation: 0x8006 }, // SRC_ALPHA, ONE, FUNC_ADD
    multiply: { src: 0x0300, dst: 0x0303, equation: 0x8006 }, // ZERO, ONE_MINUS_SRC_ALPHA, FUNC_ADD → dst * src
    screen: { src: 0x0001, dst: 0x0001, equation: 0x8006 }, // ONE, ONE, FUNC_ADD
};
export class AlphaDepthOptimizer {
    constructor() {
        this.currentMode = "normal";
    }
    /**
     * 불투명/투명 오브젝트 분리
     */
    batchOpaqueFirst(renderables) {
        const opaque = [];
        const transparent = [];
        for (const r of renderables) {
            if (r.opaque)
                opaque.push(r);
            else
                transparent.push(r);
        }
        return { opaque, transparent };
    }
    /**
     * 투명 오브젝트 Back-to-Front 정렬 (카메라 거리 기준)
     */
    sortTransparent(renderables, cameraPos) {
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
    setDepthWrite(gl, enable) {
        gl.depthMask(enable);
    }
    /**
     * 블렌드 모드 설정
     */
    setBlendMode(gl, mode) {
        if (mode === this.currentMode)
            return;
        const state = BLEND_STATES[mode];
        gl.blendFunc(state.src, state.dst);
        gl.blendEquation(state.equation);
        this.currentMode = mode;
        if (mode === "normal" || mode === "additive") {
            gl.enable(gl.BLEND);
        }
        else {
            gl.enable(gl.BLEND);
        }
    }
    /**
     * 현재 블렌드 모드
     */
    get mode() {
        return this.currentMode;
    }
}
//# sourceMappingURL=alpha_depth_optimizer.js.map