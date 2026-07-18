/**
 * [E58] IndexedDB 할당량 보호기 — IndexedDBQuotaProtector
 *
 * 목적: IndexedDB 저장소 할당량 초과 시 자동 정리하여
 *       저장 실패 방지.
 *
 * 핵심 로직:
 *   1. 저장 전 할당량 체크
 *   2. 할당량 초과 시 오래된 데이터부터 자동 삭제
 */

export interface QuotaInfo {
    readonly usage: number;
    readonly quota: number;
    readonly available: number;
    readonly usagePercent: number;
}

export class IndexedDBQuotaProtector {
    private readonly dbName: string;
    private readonly storeName: string;
    private readonly maxEntries: number;

    constructor(dbName: string, storeName: string, maxEntries = 500) {
        this.dbName = dbName;
        this.storeName = storeName;
        this.maxEntries = maxEntries;
    }

    /** 저장소 할당량 정보 조회 */
    async getQuotaInfo(): Promise<QuotaInfo> {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            const usage = estimate.usage ?? 0;
            const quota = estimate.quota ?? 0;
            return {
                usage,
                quota,
                available: quota - usage,
                usagePercent: quota > 0 ? (usage / quota) * 100 : 0,
            };
        }
        return { usage: 0, quota: 0, available: 0, usagePercent: 0 };
    }

    /** 저장 전 할당량 체크 */
    async canSave(dataSize: number): Promise<boolean> {
        const info = await this.getQuotaInfo();
        return info.available > dataSize * 2; // 2배 여유 필요
    }

    /** 오래된 데이터 정리 */
    async cleanOldEntries(keepCount: number = this.maxEntries): Promise<number> {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([this.storeName], 'readwrite');
            const store = tx.objectStore(this.storeName);

            const countReq = store.count();
            countReq.onsuccess = () => {
                if (countReq.result <= keepCount) {
                    resolve(0);
                    return;
                }

                const deleteCount = countReq.result - keepCount;
                const cursorReq = store.openCursor();
                let deleted = 0;

                cursorReq.onsuccess = () => {
                    const cursor = cursorReq.result;
                    if (cursor && deleted < deleteCount) {
                        store.delete(cursor.primaryKey);
                        deleted++;
                        cursor.continue();
                    } else {
                        resolve(deleted);
                    }
                };
            };
            countReq.onerror = () => reject(countReq.error);
        });
    }

    private async openDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(this.dbName, 1);
            req.onupgradeneeded = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
                }
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }
}
