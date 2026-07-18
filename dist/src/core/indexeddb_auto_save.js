export class IndexedDBAutoSave {
    constructor(dbName = "RTK8_SaveData", storeName = "saves") {
        this.db = null;
        this.autoSaveInterval = null;
        this.dbName = dbName;
        this.storeName = storeName;
    }
    async open() {
        return new Promise((resolve) => {
            const request = indexedDB.open(this.dbName, 1);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: "id" });
                }
                if (!db.objectStoreNames.contains("metadata")) {
                    db.createObjectStore("metadata", { keyPath: "key" });
                }
            };
            request.onsuccess = () => {
                this.db = request.result;
                resolve(true);
            };
            request.onerror = () => {
                console.error("[IndexedDB] Failed to open:", request.error);
                resolve(false);
            };
        });
    }
    async save(id, data) {
        if (!this.db)
            return false;
        return new Promise((resolve) => {
            const tx = this.db.transaction([this.storeName], "readwrite");
            const store = tx.objectStore(this.storeName);
            const entry = { id, data, timestamp: Date.now(), version: 1 };
            store.put(entry);
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => resolve(false);
        });
    }
    async load(id) {
        if (!this.db)
            return null;
        return new Promise((resolve) => {
            const tx = this.db.transaction([this.storeName], "readonly");
            const store = tx.objectStore(this.storeName);
            const request = store.get(id);
            request.onsuccess = () => {
                const result = request.result;
                if (result)
                    resolve({ data: result.data, timestamp: result.timestamp });
                else
                    resolve(null);
            };
            request.onerror = () => resolve(null);
        });
    }
    async delete(id) {
        if (!this.db)
            return false;
        return new Promise((resolve) => {
            const tx = this.db.transaction([this.storeName], "readwrite");
            const store = tx.objectStore(this.storeName);
            store.delete(id);
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => resolve(false);
        });
    }
    async listSaves() {
        if (!this.db)
            return [];
        return new Promise((resolve) => {
            const tx = this.db.transaction([this.storeName], "readonly");
            const store = tx.objectStore(this.storeName);
            const request = store.getAll();
            request.onsuccess = () => {
                const entries = (request.result ?? []);
                resolve(entries.map((e) => ({ id: e.id, timestamp: e.timestamp })));
            };
            request.onerror = () => resolve([]);
        });
    }
    async getMetadata(key) {
        if (!this.db)
            return null;
        return new Promise((resolve) => {
            const tx = this.db.transaction(["metadata"], "readonly");
            const store = tx.objectStore("metadata");
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result?.value ?? null);
            request.onerror = () => resolve(null);
        });
    }
    startAutoSave(getData, intervalMs = 60000) {
        if (this.autoSaveInterval)
            return;
        this.autoSaveInterval = setInterval(async () => {
            const data = getData();
            await this.save("autosave", data);
        }, intervalMs);
    }
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }
}
//# sourceMappingURL=indexeddb_auto_save.js.map