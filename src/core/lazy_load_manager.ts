export class LazyLoadManager {
  private loaded = new Set<string>();
  private loading = new Map<string, Promise<unknown>>();
  private preloadQueue: string[] = [];

  async loadAsset<T>(url: string, loader: () => Promise<T>): Promise<T> {
    if (this.loaded.has(url)) {
      return Promise.resolve(undefined as unknown as T);
    }
    if (this.loading.has(url)) {
      return this.loading.get(url) as Promise<T>;
    }
    const promise = loader().then((result) => {
      this.loaded.add(url);
      this.loading.delete(url);
      return result;
    });
    this.loading.set(url, promise);
    return promise;
  }

  preloadImages(urls: string[]): void {
    for (const url of urls) {
      if (this.loaded.has(url) || this.loading.has(url)) continue;
      const promise = new Promise<void>((resolve) => {
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

  preloadAudio(urls: string[]): void {
    for (const url of urls) {
      if (this.loaded.has(url) || this.loading.has(url)) continue;
      const promise = new Promise<void>((resolve) => {
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

  enqueuePreload(url: string): void {
    if (!this.loaded.has(url) && !this.loading.has(url)) {
      this.preloadQueue.push(url);
    }
  }

  processQueue(batchSize = 5): void {
    const batch = this.preloadQueue.splice(0, batchSize);
    this.preloadImages(batch);
  }

  isLoaded(url: string): boolean {
    return this.loaded.has(url);
  }

  getLoadingCount(): number {
    return this.loading.size;
  }

  getLoadedCount(): number {
    return this.loaded.size;
  }

  getQueueLength(): number {
    return this.preloadQueue.length;
  }

  clearCache(): void {
    this.loaded.clear();
    this.loading.clear();
    this.preloadQueue = [];
  }
}