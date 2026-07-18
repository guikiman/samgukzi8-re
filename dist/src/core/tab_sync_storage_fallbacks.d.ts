/**
 * [E50] 탭 동기화 저장소 폴백 체인 — TabSyncStorageFallbacks
 *
 * 목적: localStorage 접근 실패 시 IndexedDB → 메모리 순차 폴백.
 *
 * 핵심 로직:
 *   1. localStorage → IndexedDB → InMemory 순 폴백 체인
 *   2. 각 계층 실패 시 자동 다음 계층 전환
 */
export interface StorageProvider {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
    clear(): void;
}
export declare class TabSyncStorageFallbacks {
    private providers;
    private activeProvider;
    constructor();
    private initProviders;
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
    clear(): void;
}
//# sourceMappingURL=tab_sync_storage_fallbacks.d.ts.map