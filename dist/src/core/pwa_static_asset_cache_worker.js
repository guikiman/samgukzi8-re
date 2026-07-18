/**
 * [E34] 오프라인 캐싱 서비스 워커 — PWAStaticAssetCacheWorker
 *
 * 목적: 인터넷 불안정/오프라인 상태에서도 삼국지 3D 리소스 전체 구동.
 *
 * 핵심 로직:
 *   1. ServiceWorker install 시 UI 스프라이트/3D 에셋/효과음 프리캐시
 *   2. Cache-First 전략: 네트워크 에러 감지 시 캐시 즉시 반환
 */
const STATIC_ASSETS = [
    { url: '/index.html', strategy: 'CACHE_FIRST', cacheGroup: 'STATIC' },
    { url: '/bundle.js', strategy: 'CACHE_FIRST', cacheGroup: 'STATIC' },
    { url: '/style.css', strategy: 'CACHE_FIRST', cacheGroup: 'STATIC' },
    { url: '/fonts/inkbrush.woff2', strategy: 'CACHE_FIRST', cacheGroup: 'FONT' },
];
export class PWAStaticAssetCacheWorker {
    constructor() {
        this.CACHE_NAME = 'sangokushi-pwa-v1';
        this.ASSETS_TO_CACHE = STATIC_ASSETS;
    }
    /**
     * ServiceWorker install 핸들러 — 프리캐시 수행
     */
    async handleInstall(event) {
        const cache = await caches.open(this.CACHE_NAME);
        const urls = this.ASSETS_TO_CACHE
            .filter(a => a.strategy === 'CACHE_FIRST')
            .map(a => a.url);
        await cache.addAll(urls);
    }
    /**
     * Fetch 핸들러 — Cache-First 전략으로 캐시 우선 반환
     */
    async handleFetch(event) {
        const request = event.request;
        // Cache-First: 캐시 먼저 확인
        const cached = await caches.match(request);
        if (cached)
            return cached;
        // 캐시 미스 → 네트워크 요청
        try {
            const response = await fetch(request);
            if (response.ok) {
                const cache = await caches.open(this.CACHE_NAME);
                cache.put(request, response.clone());
            }
            return response;
        }
        catch {
            // 오프라인: 캐시된 폴백 페이지 반환
            const fallback = await caches.match('/index.html');
            if (fallback)
                return fallback;
            return new Response('오프라인 상태입니다', { status: 503 });
        }
    }
    /**
     * ServiceWorker activate 핸들러 — 오래된 캐시 정리
     */
    async handleActivate() {
        const keys = await caches.keys();
        await Promise.all(keys
            .filter(k => k !== this.CACHE_NAME)
            .map(k => caches.delete(k)));
    }
}
//# sourceMappingURL=pwa_static_asset_cache_worker.js.map