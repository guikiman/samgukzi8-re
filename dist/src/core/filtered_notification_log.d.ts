export type LogCategory = "all" | "battle" | "diplomacy" | "domestic" | "personnel" | "event" | "warning";
export interface LogEntry {
    readonly id: string;
    readonly timestamp: number;
    readonly category: LogCategory;
    readonly message: string;
    readonly importance: "low" | "normal" | "high" | "critical";
    readonly relatedOfficerId?: string;
    readonly relatedFactionId?: string;
}
export declare class FilteredNotificationLog {
    private entries;
    private readonly maxEntries;
    private activeFilter;
    private importanceFilter;
    private searchQuery;
    constructor(maxEntries?: number);
    addEntry(entry: Omit<LogEntry, "id" | "timestamp">): string;
    addBattleLog(message: string, importance?: LogEntry["importance"]): void;
    addDiplomacyLog(message: string, importance?: LogEntry["importance"]): void;
    addDomesticLog(message: string, importance?: LogEntry["importance"]): void;
    addPersonnelLog(message: string, importance?: LogEntry["importance"]): void;
    addEventLog(message: string, importance?: LogEntry["importance"]): void;
    addWarning(message: string): void;
    setFilter(category: LogCategory): void;
    setImportanceFilter(importance: LogEntry["importance"] | null): void;
    setSearchQuery(query: string): void;
    getFilteredEntries(): LogEntry[];
    getEntriesByOfficer(officerId: string): LogEntry[];
    getEntriesByFaction(factionId: string): LogEntry[];
    getCriticalEntries(): LogEntry[];
    getEntryCount(): number;
    clear(): void;
    exportAsText(): string;
}
//# sourceMappingURL=filtered_notification_log.d.ts.map