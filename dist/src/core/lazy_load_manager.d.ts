export declare class LazyLoadManager {
    private loaded;
    private loading;
    private preloadQueue;
    loadAsset<T>(url: string, loader: () => Promise<T>): Promise<T>;
    preloadImages(urls: string[]): void;
    preloadAudio(urls: string[]): void;
    enqueuePreload(url: string): void;
    processQueue(batchSize?: number): void;
    isLoaded(url: string): boolean;
    getLoadingCount(): number;
    getLoadedCount(): number;
    getQueueLength(): number;
    clearCache(): void;
}
//# sourceMappingURL=lazy_load_manager.d.ts.map