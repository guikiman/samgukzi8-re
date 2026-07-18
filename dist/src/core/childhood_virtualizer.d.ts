/**
 * [Task 44] 자녀 성장 단계 압축 저장 — ChildhoodVirtualizer
 *
 * 0~14세 아동기를 연간 스냅샷으로 압축하여 저장.
 */
import type { OfficerID, OfficerStats, OfficerExp, Personality } from "./types.js";
export declare enum ChildhoodStage {
    INFANT = 0,
    TODDLER = 1,
    CHILD = 2,
    ADOLESCENT = 3
}
export interface ChildhoodYearSnapshot {
    readonly age: number;
    readonly stage: ChildhoodStage;
    readonly height: number;
    readonly weight: number;
    readonly stats: Partial<OfficerStats>;
    readonly exp: Partial<OfficerExp>;
    readonly personalityTraits: string[];
    readonly notableEvent: string | null;
    readonly health: number;
}
export interface ChildhoodRecord {
    readonly officerId: OfficerID;
    readonly birthYear: number;
    readonly birthMonth: number;
    readonly parentFatherId: OfficerID | null;
    readonly parentMotherId: OfficerID | null;
    snapshots: ChildhoodYearSnapshot[];
    readonly baseStats: OfficerStats;
    readonly basePersonality: Personality;
    isVirtualized: boolean;
}
export declare class ChildhoodVirtualizer {
    private records;
    initializeRecord(officerId: OfficerID, birthYear: number, birthMonth: number, fatherId: OfficerID | null, motherId: OfficerID | null, baseStats: OfficerStats, basePersonality: Personality): ChildhoodRecord;
    addYearSnapshot(officerId: OfficerID, age: number, statsGrowth: Partial<OfficerStats>, expGrowth: Partial<OfficerExp>, event: string | null, health: number): boolean;
    virtualize(officerId: OfficerID, currentYear: number): ChildhoodRecord;
    getProjectedStatsAtAge(officerId: OfficerID, targetAge: number): OfficerStats | null;
    mature(officerId: OfficerID, currentYear: number): {
        finalStats: OfficerStats;
        finalExp: OfficerExp;
        finalPersonality: Personality;
        childhoodSummary: string;
    };
    getRecord(officerId: OfficerID): ChildhoodRecord | undefined;
    isVirtualized(officerId: OfficerID): boolean;
    deleteRecord(officerId: OfficerID): boolean;
    getCompressedSize(officerId: OfficerID): number;
}
//# sourceMappingURL=childhood_virtualizer.d.ts.map