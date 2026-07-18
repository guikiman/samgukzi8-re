/**
 * [A2] 무장 열전 저장소 — Officer Biography Store
 *
 * OfficerBiographyStore:
 *   1. 1,000명 무장 데이터 O(1) 정규화 맵
 *   2. 생몰년, 성향, 열전 데이터
 *   3. 수명 임계치 자연사 이벤트
 *   4. 이름/별명으로 검색
 */

export interface OfficerBio {
    readonly id: string;
    readonly name: string;
    readonly chineseName: string;
    readonly aliases: string[];
    readonly birthYear: number;
    readonly deathYear: number;
    readonly biography: string;
    readonly personality: string;
    readonly skills: string[];
    readonly portrait?: string;
}

export interface NaturalDeathEvent {
    readonly officerId: string;
    readonly name: string;
    readonly age: number;
    readonly year: number;
}

export class OfficerBiographyStore {
    private officers: Map<string, OfficerBio> = new Map();
    private deathHistory: NaturalDeathEvent[] = [];

    addOfficer(bio: OfficerBio): void {
        this.officers.set(bio.id, { ...bio });
    }

    getOfficer(id: string): OfficerBio | null {
        return this.officers.get(id) ?? null;
    }

    searchByName(name: string): OfficerBio[] {
        const lower = name.toLowerCase();
        return Array.from(this.officers.values())
            .filter(o =>
                o.name.toLowerCase().includes(lower) ||
                o.chineseName.toLowerCase().includes(lower) ||
                o.aliases.some(a => a.toLowerCase().includes(lower))
            );
    }

    getAllOfficers(): OfficerBio[] {
        return Array.from(this.officers.values());
    }

    getOfficersByPersonality(personality: string): OfficerBio[] {
        return Array.from(this.officers.values())
            .filter(o => o.personality === personality);
    }

    getOfficersBornInYear(year: number): OfficerBio[] {
        return Array.from(this.officers.values())
            .filter(o => o.birthYear === year);
    }

    getOfficersAliveInYear(year: number): OfficerBio[] {
        return Array.from(this.officers.values())
            .filter(o => o.birthYear <= year && (o.deathYear === 0 || o.deathYear >= year));
    }

    checkNaturalDeaths(year: number): NaturalDeathEvent[] {
        const deaths: NaturalDeathEvent[] = [];
        for (const officer of this.officers.values()) {
            if (officer.deathYear === 0) continue;
            if (officer.deathYear === year) {
                const age = year - officer.birthYear;
                const event: NaturalDeathEvent = { officerId: officer.id, name: officer.name, age, year };
                deaths.push(event);
                this.deathHistory.push(event);
            }
        }
        return deaths;
    }

    getDeathHistory(): NaturalDeathEvent[] {
        return [...this.deathHistory];
    }

    calculateAge(officerId: string, currentYear: number): number {
        const officer = this.officers.get(officerId);
        if (!officer) return -1;
        return currentYear - officer.birthYear;
    }

    isAlive(officerId: string, currentYear: number): boolean {
        const officer = this.officers.get(officerId);
        if (!officer) return false;
        return currentYear >= officer.birthYear && (officer.deathYear === 0 || currentYear <= officer.deathYear);
    }

    removeOfficer(id: string): boolean {
        return this.officers.delete(id);
    }

    clear(): void {
        this.officers.clear();
        this.deathHistory = [];
    }

    get count(): number { return this.officers.size; }
}
