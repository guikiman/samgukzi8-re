/**
 * [Task 76] 멀티 텍스처 바인더 — MultiTextureBinder
 *
 * 목적: WebGL 텍스처 유닛 관리를 추상화하여
 *       다중 텍스처 바인딩을 단순화.
 *
 * 핵심 로직:
 *   1. 텍스처 유닛 할당/해제 (최대 gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS)
 *   2. 텍스처-유닛 바인딩 캐시
 *   3. 유닛 부족 시 LRU 기반 해제
 */
export declare class MultiTextureBinder {
    private gl;
    private bindings;
    private unitPool;
    private maxUnits;
    /**
     * WebGL 컨텍스트 연결
     */
    bindContext(gl: WebGL2RenderingContext): void;
    /**
     * 텍스처를 특정 이름으로 바인딩
     */
    bind(name: string, texture: WebGLTexture): number | null;
    /**
     * 바인딩 해제
     */
    unbind(name: string): void;
    /**
     * 모든 바인딩 해제
     */
    unbindAll(): void;
    /**
     * 특정 이름의 텍스처 유닛 번호 조회
     */
    getUnit(name: string): number | undefined;
    /**
     * 사용 중인 바인딩 수
     */
    get activeBindings(): number;
    private evictLRU;
}
//# sourceMappingURL=multi_texture_binder.d.ts.map