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
export declare class AlphaDepthOptimizer {
    private currentMode;
    /**
     * 불투명/투명 오브젝트 분리
     */
    batchOpaqueFirst(renderables: readonly Renderable[]): {
        opaque: Renderable[];
        transparent: Renderable[];
    };
    /**
     * 투명 오브젝트 Back-to-Front 정렬 (카메라 거리 기준)
     */
    sortTransparent(renderables: readonly Renderable[], cameraPos: {
        x: number;
        y: number;
        z: number;
    }): Renderable[];
    /**
     * 깊이 쓰기 활성화/비활성화
     */
    setDepthWrite(gl: WebGL2RenderingContext, enable: boolean): void;
    /**
     * 블렌드 모드 설정
     */
    setBlendMode(gl: WebGL2RenderingContext, mode: AlphaBlendMode): void;
    /**
     * 현재 블렌드 모드
     */
    get mode(): AlphaBlendMode;
}
//# sourceMappingURL=alpha_depth_optimizer.d.ts.map