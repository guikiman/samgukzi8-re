import type { Personality, OfficerID, FactionID } from "./types";
export interface SuccessionContext {
    readonly factionId: FactionID;
    readonly deceasedLeaderId: OfficerID;
    readonly candidates: SuccessionCandidate[];
    readonly factionStability: number;
    readonly deceasedPersonality: Personality;
}
export interface SuccessionCandidate {
    readonly id: OfficerID;
    readonly name: string;
    readonly relationToLeader: "son" | "daughter" | "spouse" | "adopted" | "brother" | "cousin" | "strategist" | "general";
    readonly leadership: number;
    readonly intelligence: number;
    readonly charisma: number;
    readonly loyalty: number;
    readonly ambition: number;
    readonly merit: number;
    readonly age: number;
    readonly personality: Personality;
}
export interface SuccessionResult {
    readonly successorId: OfficerID;
    readonly method: "bloodline" | "merit" | "coup" | "appointed" | "collapse";
    readonly stabilityChange: number;
    readonly description: string;
}
export declare class SuccessionSystem {
    determineSuccessor(ctx: SuccessionContext): SuccessionResult;
    calculateSuccessorLoyalty(successor: SuccessionCandidate, otherCandidates: SuccessionCandidate[]): Map<OfficerID, number>;
}
//# sourceMappingURL=succession_system.d.ts.map