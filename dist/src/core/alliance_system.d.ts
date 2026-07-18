import type { FactionID, Personality } from "./types";
export type TreatyType = "NONE" | "CEASEFIRE" | "ALLIANCE" | "VASSAL" | "MILITARY_COALITION";
export interface Treaty {
    readonly between: [FactionID, FactionID];
    readonly type: TreatyType;
    readonly signedAt: number;
    readonly duration: number;
    readonly terms: string[];
}
export declare class AllianceSystem {
    private treaties;
    proposeTreaty(proposerId: FactionID, targetId: FactionID, type: TreatyType, proposerDiplomacy: number, proposerPersonality: Personality, powerRatio: number, commonEnemy: FactionID | null): {
        accepted: boolean;
        reason: string;
    };
    checkTreatyExpiry(): Treaty[];
    breakTreaty(factionId: FactionID, treaty: Treaty): void;
    getActiveTreaties(factionId: FactionID): Treaty[];
    isAtWar(factionId: FactionID): boolean;
    formCoalitionAgainst(targetId: FactionID, proposerId: FactionID, potentialMembers: Array<{
        id: FactionID;
        diplomacy: number;
        relationWithTarget: number;
    }>): Treaty[];
}
//# sourceMappingURL=alliance_system.d.ts.map