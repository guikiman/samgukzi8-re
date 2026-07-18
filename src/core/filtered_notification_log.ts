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

export class FilteredNotificationLog {
  private entries: LogEntry[] = [];
  private readonly maxEntries: number;
  private activeFilter: LogCategory = "all";
  private importanceFilter: Set<LogEntry["importance"]> = new Set();
  private searchQuery = "";

  constructor(maxEntries = 500) {
    this.maxEntries = maxEntries;
  }

  addEntry(entry: Omit<LogEntry, "id" | "timestamp">): string {
    const id = `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const full: LogEntry = { ...entry, id, timestamp: Date.now() };

    if (this.entries.length >= this.maxEntries) {
      this.entries.shift();
    }
    this.entries.push(full);
    return id;
  }

  addBattleLog(message: string, importance: LogEntry["importance"] = "normal"): void {
    this.addEntry({ category: "battle", message, importance });
  }

  addDiplomacyLog(message: string, importance: LogEntry["importance"] = "normal"): void {
    this.addEntry({ category: "diplomacy", message, importance });
  }

  addDomesticLog(message: string, importance: LogEntry["importance"] = "low"): void {
    this.addEntry({ category: "domestic", message, importance });
  }

  addPersonnelLog(message: string, importance: LogEntry["importance"] = "normal"): void {
    this.addEntry({ category: "personnel", message, importance });
  }

  addEventLog(message: string, importance: LogEntry["importance"] = "high"): void {
    this.addEntry({ category: "event", message, importance });
  }

  addWarning(message: string): void {
    this.addEntry({ category: "warning", message, importance: "critical" });
  }

  setFilter(category: LogCategory): void {
    this.activeFilter = category;
  }

  setImportanceFilter(importance: LogEntry["importance"] | null): void {
    if (importance) {
      this.importanceFilter = new Set([importance]);
    } else {
      this.importanceFilter = new Set();
    }
  }

  setSearchQuery(query: string): void {
    this.searchQuery = query.toLowerCase();
  }

  getFilteredEntries(): LogEntry[] {
    let filtered = this.entries;

    if (this.activeFilter !== "all") {
      filtered = filtered.filter((e) => e.category === this.activeFilter);
    }

    if (this.importanceFilter.size > 0) {
      filtered = filtered.filter((e) => this.importanceFilter.has(e.importance));
    }

    if (this.searchQuery) {
      filtered = filtered.filter((e) =>
        e.message.toLowerCase().includes(this.searchQuery) ||
        e.category.toLowerCase().includes(this.searchQuery),
      );
    }

    return [...filtered].reverse();
  }

  getEntriesByOfficer(officerId: string): LogEntry[] {
    return this.entries
      .filter((e) => e.relatedOfficerId === officerId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  getEntriesByFaction(factionId: string): LogEntry[] {
    return this.entries
      .filter((e) => e.relatedFactionId === factionId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  getCriticalEntries(): LogEntry[] {
    return this.entries
      .filter((e) => e.importance === "critical")
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  getEntryCount(): number {
    return this.entries.length;
  }

  clear(): void {
    this.entries = [];
  }

  exportAsText(): string {
    return this.entries
      .map((e) => `[${e.category.toUpperCase()}] ${new Date(e.timestamp).toISOString()} - ${e.message}`)
      .join("\n");
  }
}