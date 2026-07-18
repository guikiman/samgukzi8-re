/**
 * [E45] IndexedDB 저장소 균형 분산기 — IndexedDBStoreBalancer
 *
 * 목적: 단일 DB에 과도한 데이터가 쌓여 트랜잭션 지연이 발생하지 않도록
 *       여러 DB 인스턴스로 분산 저장.
 *
 * 핵심 로직:
 *   1. DB 이름 해시 기반 샤딩
 *   2. 읽기/쓰기 부하 분산
 */

export interface ShardConfig {
    readonly shardCount: number;
    readonly baseName: string;
}

export class IndexedDBStoreBalancer {
    private readonly config: ShardConfig;
    private dbs: Map<number, IDBDatabase> = new Map();

    constructor(config: ShardConfig) {
        this.config = config;
    }

    /** 키에 해당하는 샤드 인덱스 계산 */
    getShardIndex(key: string): number {
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            hash = ((hash << 5) - hash) + key.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash) % this.config.shardCount;
    }

    /** 샤드 DB 이름 */
    private shardDbName(index: number): string {
        return `${this.config.baseName}_shard_${index}`;
    }

    /** 샤드 DB 열기 */
    async openShard(index: number): Promise<IDBDatabase> {
        if (this.dbs.has(index)) return this.dbs.get(index)!;

        return new Promise((resolve, reject) => {
            const req = indexedDB.open(this.shardDbName(index), 1);
            req.onupgradeneeded = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains('shard_data')) {
                    db.createObjectStore('shard_data', { keyPath: 'key' });
                }
            };
            req.onsuccess = () => {
                this.dbs.set(index, req.result);
                resolve(req.result);
            };
            req.onerror = () => reject(req.error);
        });
    }

    /** 데이터 저장 (자동 샤딩) */
    async set(key: string, value: unknown): Promise<void> {
        const shardIndex = this.getShardIndex(key);
        const db = await this.openShard(shardIndex);
        return new Promise((resolve, reject) => {
            const tx = db.transaction(['shard_data'], 'readwrite');
            const store = tx.objectStore('shard_data');
            const req = store.put({ key, value: JSON.stringify(value) });
            req.onerror = () => reject(req.error);
            req.onsuccess = () => resolve();
        });
    }

    /** 데이터 조회 */
    async get<T>(key: string): Promise<T | null> {
        const shardIndex = this.getShardIndex(key);
        const db = await this.openShard(shardIndex);
        return new Promise((resolve, reject) => {
            const tx = db.transaction(['shard_data'], 'readonly');
            const store = tx.objectStore('shard_data');
            const req = store.get(key);
            req.onerror = () => reject(req.error);
            req.onsuccess = () => {
                const result = req.result;
                resolve(result ? JSON.parse(result.value) as T : null);
            };
        });
    }

    /** 데이터 삭제 */
    async delete(key: string): Promise<void> {
        const shardIndex = this.getShardIndex(key);
        const db = await this.openShard(shardIndex);
        return new Promise((resolve, reject) => {
            const tx = db.transaction(['shard_data'], 'readwrite');
            const store = tx.objectStore('shard_data');
            const req = store.delete(key);
            req.onerror = () => reject(req.error);
            req.onsuccess = () => resolve();
        });
    }

    /** 모든 샤드 초기화 */
    async clearAll(): Promise<void> {
        for (let i = 0; i < this.config.shardCount; i++) {
            const db = await this.openShard(i);
            await new Promise<void>((resolve, reject) => {
                const tx = db.transaction(['shard_data'], 'readwrite');
                const store = tx.objectStore('shard_data');
                const req = store.clear();
                req.onerror = () => reject(req.error);
                req.onsuccess = () => resolve();
            });
        }
    }

}
