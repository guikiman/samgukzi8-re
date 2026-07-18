/**
 * [Task 42] 가문 평판 점수 관리 — ClanHonorStore
 *
 * 가문(Clan) 단위 명예 점수 추적 및 등급 관리.
 */
import type { OfficerID } from "./types.js";
export type ClanID = string;
export interface ClanHonorEvent {
    readonly id: string;
    readonly clanId: ClanID;
    readonly delta: number;
    readonly reason: string;
    readonly turn: number;
    readonly year: number;
    readonly month: number;
    readonly officerId?: OfficerID;
}
export declare enum ClanRank {
    UNKNOWN = 0,
    NOBLE = 100,
    KNIGHT = 300,
    BARON = 600,
    VISCOUNT = 1000,
    COUNT = 1500,
    MARQUESS = 2100,
    DUKE = 2800,
    PRINCE = 3600,
    ROYAL = 5000
}
export interface ClanData {
    readonly id: ClanID;
    readonly name: string;
    readonly founderId: OfficerID;
    currentPatriarchId: OfficerID;
    honor: number;
    rank: ClanRank;
    memberIds: OfficerID[];
    readonly foundedYear: number;
    readonly history: ClanHonorEvent[];
    motto: string;
    crest: string;
}
export declare class ClanHonorStore {
    private clans;
    private idCounter;
    registerClan(id: ClanID, name: string, founderId: OfficerID, year: number): ClanData;
    getClan(id: ClanID): ClanData | undefined;
    getClanByOfficer(officerId: OfficerID): ClanData | undefined;
    addMember(clanId: ClanID, officerId: OfficerID): boolean;
    removeMember(clanId: ClanID, officerId: OfficerID): boolean;
    setPatriarch(clanId: ClanID, officerId: OfficerID): boolean;
    earnHonor(clanId: ClanID, delta: number, reason: string, turn: number, year: number, month: number, officerId?: OfficerID): number;
    spendHonor(clanId: ClanID, delta: number, reason: string, turn: number, year: number, month: number, officerId?: OfficerID): {
        success: boolean;
        newTotal: number;
    };
    calculateRank(honor: number): ClanRank;
    getRankName(rank: ClanRank): string;
    getHistory(clanId: ClanID): ClanHonorEvent[];
    getAllClans(): ClanData[];
    getTopClans(n: number): ClanData[];
    getTotalHonor(clanId: ClanID): number;
    removeClan(clanId: ClanID): boolean;
}
//# sourceMappingURL=clan_honor_store.d.ts.map