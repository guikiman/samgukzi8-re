/**
 * [E44] FSM 상태 직렬화 자동 백업 — SerializedFSMStateBackup
 *
 * 목적: FSM 전환 시마다 직렬화 스냅샷을 IndexedDB에 저장하여
 *       브라우저 강제 종료 시 마지막 FSM 상태 복원.
 */

export interface FSMBackupEntry {
    readonly id?: number;
    readonly phase: string;
    readonly state: string;
    readonly snapshot: string;
    readonly timestamp: number;
}

const DB_NAME = 'FSMBackupDB';
const STORE_NAME = 'fsm_backups';
const MAX_BACKUPS = 10;

export class SerializedFSMStateBackup {
    private db: IDBDatabase | null = null;
    private ready = false;

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, 1);
            req.onupgradeneeded = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
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

    async saveState(phase: string, state: string, snapshot: string): Promise<void> {
        if (!this.ready) await this.init();
        const entry: Omit<FSMBackupEntry, 'id'> = { phase, state, snapshot, timestamp: Date.now() };

        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction([STORE_NAME], 'readwrite');
            const store = tx.objectStore(STORE_NAME);

            const countReq = store.count();
            countReq.onsuccess = () => {
                if (countReq.result >= MAX_BACKUPS) {
                    const cursorReq = store.openCursor();
                    cursorReq.onsuccess = () => {
                        const cursor = cursorReq.result;
                        if (cursor) {
                            store.delete(cursor.key);
                        }
                    };
                }
            };

            const req = store.add(entry);
            req.onerror = () => reject(req.error);
            req.onsuccess = () => resolve();
        });
    }

    async getLatestState(): Promise<FSMBackupEntry | null> {
        if (!this.ready) await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction([STORE_NAME], 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.openCursor(null, 'prev');
            req.onsuccess = () => {
                const cursor = req.result;
                resolve(cursor ? cursor.value : null);
            };
            req.onerror = () => reject(req.error);
        });
    }

    async clear(): Promise<void> {
        if (!this.ready) await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction([STORE_NAME], 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.clear();
            req.onerror = () => reject(req.error);
            req.onsuccess = () => resolve();
        });
    }
}