/**
 * [Task 68] 초상화 GC — PortraitGC
 *
 * 목적: 사용하지 않는 무장 초상화 텍스처를 메모리에서
 *       자동 해제하는 가비지 컬렉터.
 *
 * 핵심 로직:
 *   1. 참조 카운트 기반 미사용 텍스처 해제
 *   2. LRU 캐시 (maxSize 초과 시 가장 오래된 것부터 해제)
 *   3. 주기적 유휴 정리
 */
export declare class PortraitGC {
    private cache;
    private readonly maxSize;
    private gl;
    constructor(maxSize?: number);
    /**
     * WebGL 컨텍스트 연결
     */
    bindContext(gl: WebGL2RenderingContext): void;
    /**
     * 초상화 획득 (참조 카운트 증가)
     */
    acquire(key: string): WebGLTexture | undefined;
    /**
     * 초상화 반환 (참조 카운트 감소)
     */
    release(key: string): void;
    /**
     * 초상화 등록
     */
    register(key: string, texture: WebGLTexture): void;
    /**
     * 유휴 시간 정리 (참조 카운트 0이고 오래된 것 제거)
     */
    idleCleanup(): void;
    /**
     * 전체 캐시 정리
     */
    clear(): void;
    get size(): number;
    private evictLRU;
}
//# sourceMappingURL=portrait_gc.d.ts.map