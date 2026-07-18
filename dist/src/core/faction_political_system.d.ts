import type { Personality, OfficerID } from "./types";
export interface PoliticalFaction {
    readonly id: string;
    readonly name: string;
    readonly leaderId: OfficerID;
    memberIds: OfficerID[];
    readonly ideology: "expansionist" | "conservative" | "reformist" | "militarist" | "diplomatic";
    influence: number;
    cohesion: number;
}
export interface PoliticalEvent {
    readonly type: "power_struggle" | "purge" | "coalition" | "scandal" | "policy_change";
    readonly description: string;
    readonly participants: OfficerID[];
    readonly influenceDelta: Record<string, number>;
}
export declare class FactionPoliticalSystem {
    private factions;
    private factionAssignment;
    private events;
    registerFaction(faction: PoliticalFaction): void;
    getOfficerFaction(officerId: OfficerID): PoliticalFaction | null;
    getFactions(): PoliticalFaction[];
    assignToFaction(officerId: OfficerID, factionId: string): boolean;
    removeFromFaction(officerId: OfficerID): boolean;
    generatePowerStruggle(leaderId: OfficerID, challengerId: OfficerID): PoliticalEvent;
    applyInfluenceDelta(delta: Record<string, number>): void;
    calculateLoyaltyModifier(officerId: OfficerID, rulerPersonality: Personality): number;
    private getOfficerRulerFaction;
    getRecentEvents(limit?: number): PoliticalEvent[];
}
//# sourceMappingURL=faction_political_system.d.ts.map