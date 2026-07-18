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
export declare class MipmapGenerator {
    /**
     * WebGL2 밉맵 자동 생성
     */
    generate(gl: WebGL2RenderingContext, target: GLenum): boolean;
    /**
     * 밉맵 필터 모드 설정
     */
    setFilter(gl: WebGL2RenderingContext, filter: MipmapFilter): void;
    /**
     * WebGL2 밉맛 지원 여부
     */
    static isSupported(gl: WebGL2RenderingContext): boolean;
}
//# sourceMappingURL=mipmap_generator.d.ts.map