export class FilteredNotificationLog {
    constructor(maxEntries = 500) {
        this.entries = [];
        this.activeFilter = "all";
        this.importanceFilter = new Set();
        this.searchQuery = "";
        this.maxEntries = maxEntries;
    }
    addEntry(entry) {
        const id = `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const full = { ...entry, id, timestamp: Date.now() };
        if (this.entries.length >= this.maxEntries) {
            this.entries.shift();
        }
        this.entries.push(full);
        return id;
    }
    addBattleLog(message, importance = "normal") {
        this.addEntry({ category: "battle", message, importance });
    }
    addDiplomacyLog(message, importance = "normal") {
        this.addEntry({ category: "diplomacy", message, importance });
    }
    addDomesticLog(message, importance = "low") {
        this.addEntry({ category: "domestic", message, importance });
    }
    addPersonnelLog(message, importance = "normal") {
        this.addEntry({ category: "personnel", message, importance });
    }
    addEventLog(message, importance = "high") {
        this.addEntry({ category: "event", message, importance });
    }
    addWarning(message) {
        this.addEntry({ category: "warning", message, importance: "critical" });
    }
    setFilter(category) {
        this.activeFilter = category;
    }
    setImportanceFilter(importance) {
        if (importance) {
            this.importanceFilter = new Set([importance]);
        }
        else {
            this.importanceFilter = new Set();
        }
    }
    setSearchQuery(query) {
        this.searchQuery = query.toLowerCase();
    }
    getFilteredEntries() {
        let filtered = this.entries;
        if (this.activeFilter !== "all") {
            filtered = filtered.filter((e) => e.category === this.activeFilter);
        }
        if (this.importanceFilter.size > 0) {
            filtered = filtered.filter((e) => this.importanceFilter.has(e.importance));
        }
        if (this.searchQuery) {
            filtered = filtered.filter((e) => e.message.toLowerCase().includes(this.searchQuery) ||
                e.category.toLowerCase().includes(this.searchQuery));
        }
        return [...filtered].reverse();
    }
    getEntriesByOfficer(officerId) {
        return this.entries
            .filter((e) => e.relatedOfficerId === officerId)
            .sort((a, b) => b.timestamp - a.timestamp);
    }
    getEntriesByFaction(factionId) {
        return this.entries
            .filter((e) => e.relatedFactionId === factionId)
            .sort((a, b) => b.timestamp - a.timestamp);
    }
    getCriticalEntries() {
        return this.entries
            .filter((e) => e.importance === "critical")
            .sort((a, b) => b.timestamp - a.timestamp);
    }
    getEntryCount() {
        return this.entries.length;
    }
    clear() {
        this.entries = [];
    }
    exportAsText() {
        return this.entries
            .map((e) => `[${e.category.toUpperCase()}] ${new Date(e.timestamp).toISOString()} - ${e.message}`)
            .join("\n");
    }
}
//# sourceMappingURL=filtered_notification_log.js.map