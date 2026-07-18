/**
 * [E34] 오프라인 캐싱 서비스 워커 — PWAStaticAssetCacheWorker
 *
 * 목적: 인터넷 불안정/오프라인 상태에서도 삼국지 3D 리소스 전체 구동.
 *
 * 핵심 로직:
 *   1. ServiceWorker install 시 UI 스프라이트/3D 에셋/효과음 프리캐시
 *   2. Cache-First 전략: 네트워크 에러 감지 시 캐시 즉시 반환
 */
export type CacheStrategy = 'CACHE_FIRST' | 'NETWORK_FIRST' | 'STALE_WHILE_REVALIDATE';
export interface CacheAsset {
    readonly url: string;
    readonly strategy: CacheStrategy;
    readonly cacheGroup: 'STATIC' | 'AUDIO' | 'DATA' | 'FONT';
}
export declare class PWAStaticAssetCacheWorker {
    private readonly CACHE_NAME;
    private readonly ASSETS_TO_CACHE;
    /**
     * ServiceWorker install 핸들러 — 프리캐시 수행
     */
    handleInstall(event: ExtendableEvent): Promise<void>;
    /**
     * Fetch 핸들러 — Cache-First 전략으로 캐시 우선 반환
     */
    handleFetch(event: FetchEvent): Promise<Response>;
    /**
     * ServiceWorker activate 핸들러 — 오래된 캐시 정리
     */
    handleActivate(): Promise<void>;
}
/** ServiceWorker 스크립트용 전역 타입 */
interface ExtendableEvent extends Event {
    waitUntil(promise: Promise<void>): void;
}
interface FetchEvent extends Event {
    readonly request: Request;
    respondWith(response: Promise<Response> | Response): void;
}
export {};
//# sourceMappingURL=pwa_static_asset_cache_worker.d.ts.map