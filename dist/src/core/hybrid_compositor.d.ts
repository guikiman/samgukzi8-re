/**
 * [Task 64] 하이브리드 컴포지터 — HybridCompositor
 *
 * 목적: Canvas 2D 메인 렌더러와 WebGL 오버레이를 합성.
 *
 * 핵심 로직:
 *   1. 메인 캔버스 (Canvas 2D): UI, 텍스트, 스프라이트
 *   2. 오버레이 캔버스 (WebGL2): 파티클, 셰이더, 포스트 프로세싱
 *   3. 오버레이는 absolute 포지셔닝 + pointer-events: none
 */
export interface CompositeLayer {
    readonly canvas: HTMLCanvasElement;
    readonly ctx: CanvasRenderingContext2D | WebGL2RenderingContext;
    readonly type: "2d" | "webgl";
}
export declare class HybridCompositor {
    private mainCanvas;
    private overlayCanvas;
    private mainCtx;
    private glOverlayCtx;
    /**
     * 초기화
     */
    initialize(mainCanvas: HTMLCanvasElement, overlayCanvas: HTMLCanvasElement): boolean;
    /**
     * 프레임 합성
     */
    compositeFrame(): void;
    /**
     * 메인 Canvas 2D 컨텍스트
     */
    getMainContext(): CanvasRenderingContext2D;
    /**
     * WebGL 오버레이 컨텍스트
     */
    getGlOverlay(): WebGL2RenderingContext | null;
    /**
     * 레이어 불투명도 설정
     */
    setOpacity(layer: "main" | "overlay", alpha: number): void;
    /**
     * 레이어 가시성 설정
     */
    setVisibility(layer: "main" | "overlay", visible: boolean): void;
    /**
     * 리사이즈
     */
    resize(width: number, height: number): void;
    /**
     * 레이어 조회
     */
    get layers(): CompositeLayer[];
    /**
     * 정리
     */
    dispose(): void;
}
//# sourceMappingURL=hybrid_compositor.d.ts.map