import type { Personality } from "./types";

export interface BudgetAllocation {
  recruitment: number;
  military: number;
  economy: number;
  diplomacy: number;
  culture: number;
  total: number;
}

export class FactionBudgetAI {
  allocate(
    totalGold: number,
    personality: Personality,
    atWar: boolean,
    stability: number,
    threatLevel: number,
  ): BudgetAllocation {
    const weights = this.getWeightProfile(personality, atWar, stability, threatLevel);
    const totalWeight = Object.values(weights).reduce((s, w) => s + w, 0);

    return {
      recruitment: Math.floor((totalGold * weights.recruitment) / totalWeight),
      military: Math.floor((totalGold * weights.military) / totalWeight),
      economy: Math.floor((totalGold * weights.economy) / totalWeight),
      diplomacy: Math.floor((totalGold * weights.diplomacy) / totalWeight),
      culture: Math.floor((totalGold * weights.culture) / totalWeight),
      total: totalGold,
    };
  }

  private getWeightProfile(
    personality: Personality,
    atWar: boolean,
    stability: number,
    threatLevel: number,
  ): { recruitment: number; military: number; economy: number; diplomacy: number; culture: number } {
    const warBonus = atWar ? 0.15 : -0.05;
    const threatBonus = threatLevel * 0.1;

    const profiles: Record<string, { recruitment: number; military: number; economy: number; diplomacy: number; culture: number }> = {
      AGGRESSIVE: { recruitment: 0.3, military: 0.3, economy: 0.15, diplomacy: 0.1, culture: 0.15 },
      AMBITIOUS: { recruitment: 0.25, military: 0.25, economy: 0.2, diplomacy: 0.15, culture: 0.15 },
      CALM: { recruitment: 0.15, military: 0.15, economy: 0.3, diplomacy: 0.25, culture: 0.15 },
      CAUTIOUS: { recruitment: 0.2, military: 0.2, economy: 0.25, diplomacy: 0.2, culture: 0.15 },
      LOYAL: { recruitment: 0.2, military: 0.2, economy: 0.2, diplomacy: 0.2, culture: 0.2 },
      RIGHTEOUS: { recruitment: 0.15, military: 0.2, economy: 0.2, diplomacy: 0.25, culture: 0.2 },
      GREEDY: { recruitment: 0.2, military: 0.15, economy: 0.35, diplomacy: 0.2, culture: 0.1 },
      TIMID: { recruitment: 0.25, military: 0.25, economy: 0.2, diplomacy: 0.2, culture: 0.1 },
    };

    const base = profiles[personality] ?? profiles.CALM;
    return {
      recruitment: Math.max(0.05, base.recruitment + warBonus + threatBonus),
      military: Math.max(0.05, base.military + warBonus + threatBonus),
      economy: Math.max(0.05, base.economy - threatBonus),
      diplomacy: Math.max(0.05, base.diplomacy),
      culture: Math.max(0.05, base.culture - threatBonus),
    };
  }

  generateReport(allocation: BudgetAllocation, factionName: string): string {
    return `${factionName} 예산 배분: 모병 ${allocation.recruitment}G, 군사 ${allocation.military}G, 경제 ${allocation.economy}G, 외교 ${allocation.diplomacy}G, 문화 ${allocation.culture}G`;
  }
}