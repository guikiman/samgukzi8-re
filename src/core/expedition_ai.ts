import type { Personality, OfficerID, FactionID } from "./types";

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

export class ExpeditionAI {
  calculateExpeditionForce(
    targetGarrison: number,
    targetDefense: number,
    officers: OfficerBattleProfile[],
    totalAvailableFood: number,
    distance: number,
  ): ExpeditionPlan | null {
    const requiredSoldiers = Math.ceil(
      targetGarrison * 1.5 + targetDefense * 10,
    );

    const sorted = [...officers].sort(
      (a, b) => b.leadership - a.leadership,
    );
    if (sorted.length === 0) return null;

    const commander = sorted[0];
    const subCommanders = sorted.slice(1, Math.min(4, sorted.length));

    let totalSoldiers = commander.currentSoldiers;
    for (const sub of subCommanders) {
      totalSoldiers += sub.currentSoldiers;
    }

    const estimatedDuration = Math.ceil(distance * 2 + 3);
    const supplyRequired = totalSoldiers * estimatedDuration * 2;

    if (totalAvailableFood < supplyRequired) return null;
    if (totalSoldiers < requiredSoldiers) return null;

    return {
      commanderId: commander.id,
      subCommanderIds: subCommanders.map((o) => o.id),
      totalSoldiers: Math.min(totalSoldiers, requiredSoldiers),
      targetCityId: "",
      estimatedDuration,
      supplyRequired,
    };
  }

  shouldReinforce(
    currentSoldiers: number,
    originalForce: number,
    losses: number,
    morale: number,
  ): boolean {
    const remainingRatio = currentSoldiers / Math.max(1, originalForce);
    return remainingRatio < 0.5 || losses > originalForce * 0.3 || morale < 30;
  }

  calculateMarchSpeed(
    commanderLeadership: number,
    soldiers: number,
    hasCavalry: boolean,
    terrainModifier: number,
  ): number {
    const base = 10 + commanderLeadership * 0.05;
    const sizePenalty = Math.max(0, (soldiers - 10000) / 1000) * -0.5;
    const cavalryBonus = hasCavalry ? 2 : 0;
    return Math.max(1, base + sizePenalty + cavalryBonus) * terrainModifier;
  }
}