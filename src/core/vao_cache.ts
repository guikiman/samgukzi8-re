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

interface VaoEntry {
  vao: WebGLVertexArrayObject;
  lastUsed: number;
}

export class VaoCache {
  private cache = new Map<string, VaoEntry>();
  private readonly maxSize: number;

  constructor(maxSize = 256) {
    this.maxSize = maxSize;
  }

  /**
   * VAO 조회 또는 생성
   */
  getOrCreate(
    gl: WebGL2RenderingContext,
    key: string,
    setupFn: (gl: WebGL2RenderingContext) => WebGLVertexArrayObject,
  ): WebGLVertexArrayObject {
    const cached = this.cache.get(key);
    if (cached) {
      cached.lastUsed = performance.now();
      return cached.vao;
    }

    // 캐시 한계 도달 시 LRU 제거
    if (this.cache.size >= this.maxSize) {
      this.evictLRU(gl);
    }

    const vao = setupFn(gl);
    this.cache.set(key, { vao, lastUsed: performance.now() });
    return vao;
  }

  /**
   * 특정 키 제거
   */
  evict(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 전체 캐시 정리
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 캐시 크기
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * 모든 VAO 삭제 및 캐시 정리
   */
  dispose(gl: WebGL2RenderingContext): void {
    for (const entry of this.cache.values()) {
      gl.deleteVertexArray(entry.vao);
    }
    this.cache.clear();
  }

  private evictLRU(gl: WebGL2RenderingContext): void {
    let lruKey = "";
    let lruTime = Infinity;

    for (const [key, entry] of this.cache) {
      if (entry.lastUsed < lruTime) {
        lruTime = entry.lastUsed;
        lruKey = key;
      }
    }

    if (lruKey) {
      const evicted = this.cache.get(lruKey);
      if (evicted) gl.deleteVertexArray(evicted.vao);
      this.cache.delete(lruKey);
    }
  }
}
