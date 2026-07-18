/**
 * [Task 55] VAO 캐시 (LRU) — VaoCache
 *
 * 목적: Vertex Array Object를 캐싱하여 반복적인 VAO 생성 비용 절감.
 *
 * 핵심 로직:
 *   1. LRU eviction 정책 (maxSize 기본 256)
 *   2. setupFn을 통한 지연 생성
 *   3. 사용하지 않은 VAO 자동 정리
 */
export declare class VaoCache {
    private cache;
    private readonly maxSize;
    constructor(maxSize?: number);
    /**
     * VAO 조회 또는 생성
     */
    getOrCreate(gl: WebGL2RenderingContext, key: string, setupFn: (gl: WebGL2RenderingContext) => WebGLVertexArrayObject): WebGLVertexArrayObject;
    /**
     * 특정 키 제거
     */
    evict(key: string): void;
    /**
     * 전체 캐시 정리
     */
    clear(): void;
    /**
     * 캐시 크기
     */
    get size(): number;
    /**
     * 모든 VAO 삭제 및 캐시 정리
     */
    dispose(gl: WebGL2RenderingContext): void;
    private evictLRU;
}
//# sourceMappingURL=vao_cache.d.ts.map