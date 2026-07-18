/**
 * [Phase 17] 성능 최적화 - 이미지/텍스처 LRU 캐시 관리자
 */
export class CacheManager {
    constructor(limit = 100) {
        this.limit = limit;
        this.cache = new Map();
    }
    
    get(key) {
        if (!this.cache.has(key)) return null;
        const val = this.cache.get(key);
        this.cache.delete(key);
        this.cache.set(key, val);
        return val;
    }
    
    set(key, val) {
        if (this.cache.size >= this.limit) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, val);
    }
}
