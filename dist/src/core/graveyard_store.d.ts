/**
 * [Task 15] 사망자 아카이브 — GraveyardStore
 *
 * 사망한 무장의 기록을 별도 저장하여 역사적 참조 가능.
 */
import type { OfficerID, FactionID, OfficerStats } from "./types.js";
export type DeathCause = "BATTLE" | "DISEASE" | "OLD_AGE" | "EXECUTION" | "ASSASSINATION" | "ACCIDENT" | "UNKNOWN";
export interface DeceasedOfficer {
    readonly officerId: OfficerID;
    readonly name: string;
    readonly stats: OfficerStats;
    readonly factionId: FactionID | null;
    readonly deathYear: number;
    readonly deathMonth: number;
    readonly deathCause: DeathCause;
    readonly age: number;
    readonly biography: string;
    readonly achievements: string[];
    readonly killerId?: OfficerID;
    readonly killerName?: string;
}
export declare class GraveyardStore {
    private records;
    bury(officerId: OfficerID, name: string, stats: OfficerStats, factionId: FactionID | null, deathYear: number, deathMonth: number, deathCause: DeathCause, age: number, biography?: string, achievements?: string[], killerId?: OfficerID, killerName?: string): DeceasedOfficer;
    getRecord(id: OfficerID): DeceasedOfficer | undefined;
    getAllRecords(): DeceasedOfficer[];
    getRecordsByYear(year: number): DeceasedOfficer[];
    getRecordsByFaction(factionId: FactionID): DeceasedOfficer[];
    getRecordsByCause(cause: DeathCause): DeceasedOfficer[];
    getDeathCount(): number;
    getDeathCountByYear(year: number): number;
    purgeOldRecords(beforeYear: number): number;
    getTotalDeathCount(): number;
    clear(): void;
}
//# sourceMappingURL=graveyard_store.d.ts.map