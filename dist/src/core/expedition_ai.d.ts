import type { Personality, OfficerID } from "./types";
export interface OfficerBattleProfile {
    readonly id: OfficerID;
    readonly leadership: number;
    readonly might: number;
    readonly intelligence: number;
    readonly loyalty: number;
    readonly personality: Personality;
    readonly currentSoldiers: number;
    readonly maxSoldiers: number;
}
export interface ExpeditionPlan {
    readonly commanderId: OfficerID;
    readonly subCommanderIds: OfficerID[];
    readonly totalSoldiers: number;
    readonly targetCityId: string;
    readonly estimatedDuration: number;
    readonly supplyRequired: number;
}
export declare class ExpeditionAI {
    calculateExpeditionForce(targetGarrison: number, targetDefense: number, officers: OfficerBattleProfile[], totalAvailableFood: number, distance: number): ExpeditionPlan | null;
    shouldReinforce(currentSoldiers: number, originalForce: number, losses: number, morale: number): boolean;
    calculateMarchSpeed(commanderLeadership: number, soldiers: number, hasCavalry: boolean, terrainModifier: number): number;
}
//# sourceMappingURL=expedition_ai.d.ts.map