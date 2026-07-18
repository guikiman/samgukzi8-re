import type { Personality } from "./types";
export interface BudgetAllocation {
    recruitment: number;
    military: number;
    economy: number;
    diplomacy: number;
    culture: number;
    total: number;
}
export declare class FactionBudgetAI {
    allocate(totalGold: number, personality: Personality, atWar: boolean, stability: number, threatLevel: number): BudgetAllocation;
    private getWeightProfile;
    generateReport(allocation: BudgetAllocation, factionName: string): string;
}
//# sourceMappingURL=faction_budget_ai.d.ts.map