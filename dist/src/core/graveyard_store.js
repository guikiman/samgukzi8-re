/**
 * [Task 15] 사망자 아카이브 — GraveyardStore
 *
 * 사망한 무장의 기록을 별도 저장하여 역사적 참조 가능.
 */
export class GraveyardStore {
    constructor() {
        this.records = new Map();
    }
    bury(officerId, name, stats, factionId, deathYear, deathMonth, deathCause, age, biography = "", achievements = [], killerId, killerName) {
        const record = {
            officerId, name, stats, factionId, deathYear, deathMonth, deathCause, age, biography, achievements, killerId, killerName,
        };
        this.records.set(officerId, record);
        return record;
    }
    getRecord(id) {
        return this.records.get(id);
    }
    getAllRecords() {
        return Array.from(this.records.values());
    }
    getRecordsByYear(year) {
        return this.getAllRecords().filter((r) => r.deathYear === year);
    }
    getRecordsByFaction(factionId) {
        return this.getAllRecords().filter((r) => r.factionId === factionId);
    }
    getRecordsByCause(cause) {
        return this.getAllRecords().filter((r) => r.deathCause === cause);
    }
    getDeathCount() {
        return this.records.size;
    }
    getDeathCountByYear(year) {
        return this.getRecordsByYear(year).length;
    }
    purgeOldRecords(beforeYear) {
        let removed = 0;
        for (const [id, record] of this.records) {
            if (record.deathYear < beforeYear) {
                this.records.delete(id);
                removed++;
            }
        }
        return removed;
    }
    getTotalDeathCount() {
        return this.records.size;
    }
    clear() {
        this.records.clear();
    }
}
//# sourceMappingURL=graveyard_store.js.map