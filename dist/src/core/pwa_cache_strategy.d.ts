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
export type CacheStrategy = 'CACHE_FIRST' | 'NETWORK_FIRST' | 'STALE_WHILE_REVALIDATE' | 'CACHE_ON_DEMAND';
export interface CacheEntry {
    readonly url: string;
    readonly strategy: CacheStrategy;
    readonly data: string;
    readonly timestamp: number;
    readonly ttl: number;
}
export declare class PWACacheManager {
    private cacheName;
    private entries;
    constructor(cacheName?: string);
    /**
     * [41] Cache First: 정적 에셋 (HTML/CSS/JS)
     */
    cacheFirst(url: string): Promise<Response | null>;
    /**
     * [42] Network First: 동적 데이터 (API)
     */
    networkFirst(url: string): Promise<Response | null>;
    /**
     * [43] Stale While Revalidate: 외부 폰트/라이브러리
     */
    staleWhileRevalidate(url: string): Promise<Response | null>;
    /**
     * [44] Cache on Demand: 유저 액션 기반 캐싱
     */
    cacheOnDemand(url: string, data: string): Promise<void>;
    private getFromCache;
    private fetchAndCache;
    private cacheResponse;
    /**
     * [44] 오프라인 감지
     */
    isOffline(): boolean;
    getCacheSize(): number;
    clearCache(): void;
}
//# sourceMappingURL=pwa_cache_strategy.d.ts.map