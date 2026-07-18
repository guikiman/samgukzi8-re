export declare class IndexedDBAutoSave {
    private dbName;
    private storeName;
    private db;
    private autoSaveInterval;
    constructor(dbName?: string, storeName?: string);
    open(): Promise<boolean>;
    save(id: string, data: unknown): Promise<boolean>;
    load(id: string): Promise<{
        data: unknown;
        timestamp: number;
    } | null>;
    delete(id: string): Promise<boolean>;
    listSaves(): Promise<Array<{
        id: string;
        timestamp: number;
    }>>;
    getMetadata(key: string): Promise<unknown | null>;
    startAutoSave(getData: () => unknown, intervalMs?: number): void;
    stopAutoSave(): void;
}
//# sourceMappingURL=indexeddb_auto_save.d.ts.map