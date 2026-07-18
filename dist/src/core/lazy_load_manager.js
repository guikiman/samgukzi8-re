export class LazyLoadManager {
    constructor() {
        this.loaded = new Set();
        this.loading = new Map();
        this.preloadQueue = [];
    }
    async loadAsset(url, loader) {
        if (this.loaded.has(url)) {
            return Promise.resolve(undefined);
        }
        if (this.loading.has(url)) {
            return this.loading.get(url);
        }
        const promise = loader().then((result) => {
            this.loaded.add(url);
            this.loading.delete(url);
            return result;
        });
        this.loading.set(url, promise);
        return promise;
    }
    preloadImages(urls) {
        for (const url of urls) {
            if (this.loaded.has(url) || this.loading.has(url))
                continue;
            const promise = new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve();
                img.onerror = () => resolve();
                img.src = url;
            });
            this.loading.set(url, promise);
            promise.then(() => {
                this.loaded.add(url);
                this.loading.delete(url);
            });
        }
    }
    preloadAudio(urls) {
        for (const url of urls) {
            if (this.loaded.has(url) || this.loading.has(url))
                continue;
            const promise = new Promise((resolve) => {
                const audio = new Audio();
                audio.oncanplaythrough = () => resolve();
                audio.onerror = () => resolve();
                audio.preload = "auto";
                audio.src = url;
            });
            this.loading.set(url, promise);
            promise.then(() => {
                this.loaded.add(url);
                this.loading.delete(url);
            });
        }
    }
    enqueuePreload(url) {
        if (!this.loaded.has(url) && !this.loading.has(url)) {
            this.preloadQueue.push(url);
        }
    }
    processQueue(batchSize = 5) {
        const batch = this.preloadQueue.splice(0, batchSize);
        this.preloadImages(batch);
    }
    isLoaded(url) {
        return this.loaded.has(url);
    }
    getLoadingCount() {
        return this.loading.size;
    }
    getLoadedCount() {
        return this.loaded.size;
    }
    getQueueLength() {
        return this.preloadQueue.length;
    }
    clearCache() {
        this.loaded.clear();
        this.loading.clear();
        this.preloadQueue = [];
    }
}
//# sourceMappingURL=lazy_load_manager.js.map