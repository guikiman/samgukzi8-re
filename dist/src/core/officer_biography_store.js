/**
 * [A2] 무장 열전 저장소 — Officer Biography Store
 *
 * OfficerBiographyStore:
 *   1. 1,000명 무장 데이터 O(1) 정규화 맵
 *   2. 생몰년, 성향, 열전 데이터
 *   3. 수명 임계치 자연사 이벤트
 *   4. 이름/별명으로 검색
 */
export class OfficerBiographyStore {
    constructor() {
        this.officers = new Map();
        this.deathHistory = [];
    }
    addOfficer(bio) {
        this.officers.set(bio.id, { ...bio });
    }
    getOfficer(id) {
        return this.officers.get(id) ?? null;
    }
    searchByName(name) {
        const lower = name.toLowerCase();
        return Array.from(this.officers.values())
            .filter(o => o.name.toLowerCase().includes(lower) ||
            o.chineseName.toLowerCase().includes(lower) ||
            o.aliases.some(a => a.toLowerCase().includes(lower)));
    }
    getAllOfficers() {
        return Array.from(this.officers.values());
    }
    getOfficersByPersonality(personality) {
        return Array.from(this.officers.values())
            .filter(o => o.personality === personality);
    }
    getOfficersBornInYear(year) {
        return Array.from(this.officers.values())
            .filter(o => o.birthYear === year);
    }
    getOfficersAliveInYear(year) {
        return Array.from(this.officers.values())
            .filter(o => o.birthYear <= year && (o.deathYear === 0 || o.deathYear >= year));
    }
    checkNaturalDeaths(year) {
        const deaths = [];
        for (const officer of this.officers.values()) {
            if (officer.deathYear === 0)
                continue;
            if (officer.deathYear === year) {
                const age = year - officer.birthYear;
                const event = { officerId: officer.id, name: officer.name, age, year };
                deaths.push(event);
                this.deathHistory.push(event);
            }
        }
        return deaths;
    }
    getDeathHistory() {
        return [...this.deathHistory];
    }
    calculateAge(officerId, currentYear) {
        const officer = this.officers.get(officerId);
        if (!officer)
            return -1;
        return currentYear - officer.birthYear;
    }
    isAlive(officerId, currentYear) {
        const officer = this.officers.get(officerId);
        if (!officer)
            return false;
        return currentYear >= officer.birthYear && (officer.deathYear === 0 || currentYear <= officer.deathYear);
    }
    removeOfficer(id) {
        return this.officers.delete(id);
    }
    clear() {
        this.officers.clear();
        this.deathHistory = [];
    }
    get count() { return this.officers.size; }
}
//# sourceMappingURL=officer_biography_store.js.map