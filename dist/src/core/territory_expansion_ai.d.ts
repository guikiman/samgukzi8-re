import type { Personality, FactionID, CityID } from "./types";
export interface CityTarget {
    readonly cityId: CityID;
    readonly ownerId: FactionID;
    readonly garrison: number;
    readonly food: number;
    readonly defense: number;
    readonly distance: number;
    readonly value: number;
}
export declare class TerritoryExpansionAI {
    evaluateTargets(factionPersonality: Personality, factionPower: number, neighbors: CityTarget[]): CityTarget[];
    private getWeightProfile;
    shouldDeclareWar(personality: Personality, powerRatio: number, targetValue: number, existingWars: number): {
        decision: boolean;
        confidence: number;
    };
}
//# sourceMappingURL=territory_expansion_ai.d.ts.map