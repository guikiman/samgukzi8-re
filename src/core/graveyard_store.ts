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

export class GraveyardStore {
  private records = new Map<OfficerID, DeceasedOfficer>();

  bury(
    officerId: OfficerID,
    name: string,
    stats: OfficerStats,
    factionId: FactionID | null,
    deathYear: number,
    deathMonth: number,
    deathCause: DeathCause,
    age: number,
    biography = "",
    achievements: string[] = [],
    killerId?: OfficerID,
    killerName?: string,
  ): DeceasedOfficer {
    const record: DeceasedOfficer = {
      officerId, name, stats, factionId, deathYear, deathMonth, deathCause, age, biography, achievements, killerId, killerName,
    };
    this.records.set(officerId, record);
    return record;
  }

  getRecord(id: OfficerID): DeceasedOfficer | undefined {
    return this.records.get(id);
  }

  getAllRecords(): DeceasedOfficer[] {
    return Array.from(this.records.values());
  }

  getRecordsByYear(year: number): DeceasedOfficer[] {
    return this.getAllRecords().filter((r) => r.deathYear === year);
  }

  getRecordsByFaction(factionId: FactionID): DeceasedOfficer[] {
    return this.getAllRecords().filter((r) => r.factionId === factionId);
  }

  getRecordsByCause(cause: DeathCause): DeceasedOfficer[] {
    return this.getAllRecords().filter((r) => r.deathCause === cause);
  }

  getDeathCount(): number {
    return this.records.size;
  }

  getDeathCountByYear(year: number): number {
    return this.getRecordsByYear(year).length;
  }

  purgeOldRecords(beforeYear: number): number {
    let removed = 0;
    for (const [id, record] of this.records) {
      if (record.deathYear < beforeYear) {
        this.records.delete(id);
        removed++;
      }
    }
    return removed;
  }

  getTotalDeathCount(): number {
    return this.records.size;
  }

  clear(): void {
    this.records.clear();
  }
}
