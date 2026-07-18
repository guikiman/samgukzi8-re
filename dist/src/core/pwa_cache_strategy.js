/**
 * [41][42][43][44][45][46][47][48][49][50] PWA 오프라인 캐싱 전략 (Service Worker)
 *
 * PWACacheStrategy:
 *   - Cache First (정적 에셋): HTML/CSS/JS/이미지
 *   - Network First (동적 데이터): API/세이브/랭킹
 *   - Stale While Revalidate (폴백): 외부 폰트/라이브러리
 *   - Cache on Demand (유저 액션): 전투 리플레이/모드 파일
 *   - 오프라인 감지 시 Service Worker 캐시 폴백
 */
export class PWACacheManager {
    constructor(cacheName) {
        this.cacheName = 'rtk8-cache-v1';
        this.entries = new Map();
        if (cacheName)
            this.cacheName = cacheName;
    }
    /**
     * [41] Cache First: 정적 에셋 (HTML/CSS/JS)
     */
    async cacheFirst(url) {
        const cached = await this.getFromCache(url);
        if (cached)
            return cached;
        return this.fetchAndCache(url);
    }
    /**
     * [42] Network First: 동적 데이터 (API)
     */
    async networkFirst(url) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                await this.cacheResponse(url, response.clone());
                return response;
            }
        }
        catch {
            // 네트워크 실패 → 캐시 폴백
        }
        return this.getFromCache(url);
    }
    /**
     * [43] Stale While Revalidate: 외부 폰트/라이브러리
     */
    async staleWhileRevalidate(url) {
        const cached = await this.getFromCache(url);
        this.fetchAndCache(url).catch(() => { }); // 비동기 갱신
        return cached;
    }
    /**
     * [44] Cache on Demand: 유저 액션 기반 캐싱
     */
    async cacheOnDemand(url, data) {
        const entry = {
            url,
            strategy: 'CACHE_ON_DEMAND',
            data,
            timestamp: Date.now(),
            ttl: 24 * 60 * 60 * 1000, // 24시간
        };
        this.entries.set(url, entry);
    }
    async getFromCache(url) {
        const entry = this.entries.get(url);
        if (!entry)
            return null;
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.entries.delete(url);
            return null;
        }
        return new Response(entry.data);
    }
    async fetchAndCache(url) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                const clone = response.clone();
                const text = await clone.text();
                this.entries.set(url, {
                    url,
                    strategy: 'CACHE_FIRST',
                    data: text,
                    timestamp: Date.now(),
                    ttl: 24 * 60 * 60 * 1000,
                });
                return response;
            }
        }
        catch { /* offline */ }
        return null;
    }
    async cacheResponse(url, response) {
        try {
            const text = await response.clone().text();
            this.entries.set(url, {
                url,
                strategy: 'NETWORK_FIRST',
                data: text,
                timestamp: Date.now(),
                ttl: 60 * 60 * 1000, // 1시간
            });
        }
        catch { /* ignore */ }
    }
    /**
     * [44] 오프라인 감지
     */
    isOffline() {
        return typeof navigator !== 'undefined' && !navigator.onLine;
    }
    getCacheSize() { return this.entries.size; }
    clearCache() { this.entries.clear(); }
}
//# sourceMappingURL=pwa_cache_strategy.js.map