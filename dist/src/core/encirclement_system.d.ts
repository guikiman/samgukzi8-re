import type { FactionID, Personality } from "./types";
export interface FactionProfile {
    readonly id: FactionID;
    readonly name: string;
    readonly power: number;
    readonly cityCount: number;
    readonly aggression: number;
    readonly relationWithTarget: number;
    readonly personality: Personality;
}
export declare class EncirclementSystem {
    evaluateEncirclement(targetFaction: FactionProfile, worldFactions: FactionProfile[]): {
        shouldForm: boolean;
        members: FactionProfile[];
        reason: string;
    };
    calculateCohesion(members: FactionProfile[]): number;
    generateEncirclementEvent(targetName: string, memberCount: number, cohesion: number): string;
}
//# sourceMappingURL=encirclement_system.d.ts.map