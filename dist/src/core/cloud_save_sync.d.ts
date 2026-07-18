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
export interface SaveSlot {
    readonly slotId: string;
    readonly label: string;
    readonly timestamp: number;
    readonly data: string;
    readonly checksum: string;
    readonly version: string;
}
export interface CloudSaveManifest {
    readonly slots: SaveSlot[];
    readonly lastSync: number;
    readonly totalSize: number;
}
export interface SyncResult {
    readonly success: boolean;
    readonly syncedSlots: number;
    readonly conflicts: number;
    readonly errors: string[];
}
export declare class CloudSaveSync {
    private slots;
    private lastSync;
    private readonly MAX_SLOTS;
    private readonly STORAGE_KEY;
    constructor();
    saveSlot(slotId: string, label: string, data: string): SaveSlot;
    loadSlot(slotId: string): SaveSlot | null;
    deleteSlot(slotId: string): boolean;
    listSlots(): SaveSlot[];
    exportSlot(slotId: string): string | null;
    importSlot(json: string): SaveSlot | null;
    syncWithRemote(remoteSlots: SaveSlot[]): SyncResult;
    getManifest(): CloudSaveManifest;
    clear(): void;
    private computeChecksum;
    private persistToStorage;
    private loadFromStorage;
}
//# sourceMappingURL=cloud_save_sync.d.ts.map