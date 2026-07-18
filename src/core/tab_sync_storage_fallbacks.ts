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

/** 메모리 저장소 (최후 폴백) */
class InMemoryStorage implements StorageProvider {
    private store = new Map<string, string>();

    getItem(key: string): string | null {
        return this.store.get(key) ?? null;
    }
    setItem(key: string, value: string): void {
        this.store.set(key, value);
    }
    removeItem(key: string): void {
        this.store.delete(key);
    }
    clear(): void {
        this.store.clear();
    }
}

/** IndexedDB 저장소 */
class IndexedDBStorage implements StorageProvider {
    private db: IDBDatabase | null = null;
    private ready = false;

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open('TabSyncFallbackDB', 1);
            req.onupgradeneeded = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains('storage')) {
                    db.createObjectStore('storage', { keyPath: 'key' });
                }
            };
            req.onsuccess = () => {
                this.db = req.result;
                this.ready = true;
                resolve();
            };
            req.onerror = () => reject(req.error);
        });
    }

    getItem(key: string): string | null {
        // 동기 API 불가 → 메모리 캐시 사용
        return this.cache.get(key) ?? null;
    }

    private cache = new Map<string, string>();

    setItem(key: string, value: string): void {
        this.cache.set(key, value);
        if (this.ready && this.db) {
            const tx = this.db.transaction(['storage'], 'readwrite');
            tx.objectStore('storage').put({ key, value });
        }
    }

    removeItem(key: string): void {
        this.cache.delete(key);
        if (this.ready && this.db) {
            const tx = this.db.transaction(['storage'], 'readwrite');
            tx.objectStore('storage').delete(key);
        }
    }

    clear(): void {
        this.cache.clear();
        if (this.ready && this.db) {
            const tx = this.db.transaction(['storage'], 'readwrite');
            tx.objectStore('storage').clear();
        }
    }
}

export class TabSyncStorageFallbacks {
    private providers: StorageProvider[] = [];
    private activeProvider: StorageProvider;

    constructor() {
        this.activeProvider = new InMemoryStorage();
        this.initProviders();
    }

    private async initProviders(): Promise<void> {
        // 1순위: localStorage
        try {
            localStorage.setItem('__test__', '1');
            localStorage.removeItem('__test__');
            this.providers.push(localStorage);
        } catch {
            // localStorage 실패
        }

        // 2순위: IndexedDB
        try {
            const idb = new IndexedDBStorage();
            await idb.init();
            this.providers.push(idb);
        } catch {
            // IndexedDB 실패
        }

        // 3순위: 메모리
        this.providers.push(new InMemoryStorage());

        // 활성 프로바이더 설정
        this.activeProvider = this.providers[0];
    }

    getItem(key: string): string | null {
        for (const p of this.providers) {
            try {
                const val = p.getItem(key);
                if (val !== null) return val;
            } catch {
                continue;
            }
        }
        return null;
    }

    setItem(key: string, value: string): void {
        for (const p of this.providers) {
            try {
                p.setItem(key, value);
            } catch {
                continue;
            }
        }
    }

    removeItem(key: string): void {
        for (const p of this.providers) {
            try {
                p.removeItem(key);
            } catch {
                continue;
            }
        }
    }

    clear(): void {
        for (const p of this.providers) {
            try {
                p.clear();
            } catch {
                continue;
            }
        }
    }
}
