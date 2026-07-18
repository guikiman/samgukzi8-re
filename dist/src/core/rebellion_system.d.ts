import type { Personality, OfficerID, CityID } from "./types";
export interface RebellionContext {
    officerId: OfficerID;
    officerLoyalty: number;
    officerAmbition: number;
    officerPersonality: Personality;
    officerRank: number;
    officerMight: number;
    isGovernor: boolean;
    factionStability: number;
    factionPower: number;
    garrisonUnderCommand: number;
    ownsCity: CityID;
}
export interface RebellionResult {
    occurs: boolean;
    type: "independence" | "defect" | "usurp" | "none";
    confidence: number;
    description: string;
}
export declare class RebellionSystem {
    evaluateRebellion(ctx: RebellionContext): RebellionResult;
    private calculateDiscontent;
    suppressRebellion(rulerMight: number, rulerIntelligence: number, rebelMight: number, garrisonLoyalty: number): {
        suppressed: boolean;
        description: string;
    };
}
//# sourceMappingURL=rebellion_system.d.ts.map