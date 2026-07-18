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

export class TerritoryExpansionAI {
  evaluateTargets(
    factionPersonality: Personality,
    factionPower: number,
    neighbors: CityTarget[],
  ): CityTarget[] {
    const weights = this.getWeightProfile(factionPersonality);
    const scored = neighbors.map((city) => {
      const powerRatio = factionPower / Math.max(1, city.garrison);
      const proximityScore = 1 - city.distance / 100;
      const valueScore = city.value / 100;
      const defensePenalty = city.defense / 100;

      const total =
        powerRatio * weights.aggression +
        proximityScore * weights.proximity +
        valueScore * weights.value +
        defensePenalty * weights.defense * -1;

      return { city, score: total };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.map((s) => s.city);
  }

  private getWeightProfile(personality: Personality): {
    aggression: number;
    proximity: number;
    value: number;
    defense: number;
  } {
    const profiles: Record<string, { aggression: number; proximity: number; value: number; defense: number }> = {
      AGGRESSIVE: { aggression: 0.5, proximity: 0.2, value: 0.1, defense: 0.2 },
      AMBITIOUS: { aggression: 0.4, proximity: 0.15, value: 0.25, defense: 0.2 },
      CALM: { aggression: 0.2, proximity: 0.3, value: 0.2, defense: 0.3 },
      CAUTIOUS: { aggression: 0.15, proximity: 0.25, value: 0.2, defense: 0.4 },
      LOYAL: { aggression: 0.2, proximity: 0.3, value: 0.15, defense: 0.35 },
      RIGHTEOUS: { aggression: 0.25, proximity: 0.25, value: 0.2, defense: 0.3 },
      GREEDY: { aggression: 0.35, proximity: 0.15, value: 0.3, defense: 0.2 },
      TIMID: { aggression: 0.1, proximity: 0.3, value: 0.2, defense: 0.4 },
    };
    return profiles[personality] ?? { aggression: 0.3, proximity: 0.2, value: 0.2, defense: 0.3 };
  }

  shouldDeclareWar(
    personality: Personality,
    powerRatio: number,
    targetValue: number,
    existingWars: number,
  ): { decision: boolean; confidence: number } {
    const aggressionThreshold: Record<string, number> = {
      AGGRESSIVE: 0.7, AMBITIOUS: 0.8, CALM: 1.5, CAUTIOUS: 2.0,
      LOYAL: 1.2, RIGHTEOUS: 1.3, GREEDY: 0.9, TIMID: 2.5,
    };
    const threshold = aggressionThreshold[personality] ?? 1.2;

    if (existingWars >= 3) return { decision: false, confidence: 0 };
    const confidence = (powerRatio / threshold) * (targetValue / 50) * (1 - existingWars * 0.2);
    return { decision: confidence > 1.0, confidence };
  }
}