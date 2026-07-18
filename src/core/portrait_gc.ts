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

interface PortraitEntry {
  texture: WebGLTexture;
  lastUsed: number;
  refCount: number;
}

export class PortraitGC {
  private cache = new Map<string, PortraitEntry>();
  private readonly maxSize: number;
  private gl: WebGL2RenderingContext | null = null;

  constructor(maxSize = 64) {
    this.maxSize = maxSize;
  }

  /**
   * WebGL 컨텍스트 연결
   */
  bindContext(gl: WebGL2RenderingContext): void {
    this.gl = gl;
  }

  /**
   * 초상화 획득 (참조 카운트 증가)
   */
  acquire(key: string): WebGLTexture | undefined {
    const entry = this.cache.get(key);
    if (entry) {
      entry.lastUsed = performance.now();
      entry.refCount++;
      return entry.texture;
    }
    return undefined;
  }

  /**
   * 초상화 반환 (참조 카운트 감소)
   */
  release(key: string): void {
    const entry = this.cache.get(key);
    if (entry) {
      entry.refCount = Math.max(0, entry.refCount - 1);
    }
  }

  /**
   * 초상화 등록
   */
  register(key: string, texture: WebGLTexture): void {
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }
    this.cache.set(key, { texture, lastUsed: performance.now(), refCount: 1 });
  }

  /**
   * 유휴 시간 정리 (참조 카운트 0이고 오래된 것 제거)
   */
  idleCleanup(): void {
    if (!this.gl) return;
    const now = performance.now();
    const staleThreshold = 30000; // 30초

    for (const [key, entry] of this.cache) {
      if (entry.refCount === 0 && now - entry.lastUsed > staleThreshold) {
        this.gl.deleteTexture(entry.texture);
        this.cache.delete(key);
      }
    }
  }

  /**
   * 전체 캐시 정리
   */
  clear(): void {
    if (this.gl) {
      for (const entry of this.cache.values()) {
        this.gl.deleteTexture(entry.texture);
      }
    }
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }

  private evictLRU(): void {
    if (!this.gl) return;
    let lruKey = "";
    let lruTime = Infinity;

    for (const [key, entry] of this.cache) {
      if (entry.refCount === 0 && entry.lastUsed < lruTime) {
        lruTime = entry.lastUsed;
        lruKey = key;
      }
    }

    if (lruKey) {
      const evicted = this.cache.get(lruKey);
      if (evicted) this.gl.deleteTexture(evicted.texture);
      this.cache.delete(lruKey);
    }
  }
}
