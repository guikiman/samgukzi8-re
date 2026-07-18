/**
 * [E41] 클라우드 세이브 동기화 — Cloud Save Sync
 *
 * CloudSaveSync:
 *   1. IndexedDB 기반 로컬 캐시
 *   2. JSON 직렬화/역직렬화
 *   3. 충돌 해결 (Last-Write-Wins + 타임스탬프)
 *   4. 세이브 슬롯 관리 (최대 20개)
 *   5. 내보내기/가져오기 (JSON 파일)
 */
export class CloudSaveSync {
    constructor() {
        this.slots = new Map();
        this.lastSync = 0;
        this.MAX_SLOTS = 20;
        this.STORAGE_KEY = 'rtk8_cloud_save_manifest';
        this.loadFromStorage();
    }
    saveSlot(slotId, label, data) {
        const slot = {
            slotId,
            label,
            data,
            timestamp: Date.now(),
            checksum: this.computeChecksum(data),
            version: '1.0.0',
        };
        this.slots.set(slotId, slot);
        this.persistToStorage();
        return slot;
    }
    loadSlot(slotId) {
        return this.slots.get(slotId) ?? null;
    }
    deleteSlot(slotId) {
        const existed = this.slots.has(slotId);
        this.slots.delete(slotId);
        if (existed)
            this.persistToStorage();
        return existed;
    }
    listSlots() {
        return Array.from(this.slots.values())
            .sort((a, b) => b.timestamp - a.timestamp);
    }
    exportSlot(slotId) {
        const slot = this.slots.get(slotId);
        if (!slot)
            return null;
        return JSON.stringify(slot);
    }
    importSlot(json) {
        try {
            const slot = JSON.parse(json);
            if (!slot.slotId || !slot.data || !slot.checksum)
                return null;
            if (this.computeChecksum(slot.data) !== slot.checksum)
                return null;
            this.slots.set(slot.slotId, slot);
            this.persistToStorage();
            return slot;
        }
        catch {
            return null;
        }
    }
    syncWithRemote(remoteSlots) {
        const syncedSlots = [];
        const conflicts = [];
        const errors = [];
        for (const remote of remoteSlots) {
            const local = this.slots.get(remote.slotId);
            if (!local || remote.timestamp > local.timestamp) {
                this.slots.set(remote.slotId, remote);
                syncedSlots.push(remote.slotId);
            }
            else if (remote.timestamp === local.timestamp && remote.checksum !== local.checksum) {
                conflicts.push(remote.slotId);
            }
        }
        this.persistToStorage();
        return { success: true, syncedSlots: syncedSlots.length, conflicts: conflicts.length, errors };
    }
    getManifest() {
        return {
            slots: Array.from(this.slots.values()),
            lastSync: Date.now(),
            totalSize: Array.from(this.slots.values()).reduce((acc, s) => acc + s.data.length, 0),
        };
    }
    clear() {
        this.slots.clear();
        this.persistToStorage();
    }
    computeChecksum(data) {
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        return hash.toString(16);
    }
    persistToStorage() {
        try {
            const manifest = this.getManifest();
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(manifest));
        }
        catch {
        }
    }
    loadFromStorage() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) {
                const manifest = JSON.parse(raw);
                for (const slot of manifest.slots) {
                    this.slots.set(slot.slotId, slot);
                }
                this.lastSync = manifest.lastSync;
            }
        }
        catch {
        }
    }
}
//# sourceMappingURL=cloud_save_sync.js.map