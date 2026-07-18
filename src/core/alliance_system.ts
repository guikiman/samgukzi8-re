import type { FactionID, Personality } from "./types";

export type TreatyType = "NONE" | "CEASEFIRE" | "ALLIANCE" | "VASSAL" | "MILITARY_COALITION";

export interface Treaty {
  readonly between: [FactionID, FactionID];
  readonly type: TreatyType;
  readonly signedAt: number;
  readonly duration: number;
  readonly terms: string[];
}

export class AllianceSystem {
  private treaties: Treaty[] = [];

  proposeTreaty(
    proposerId: FactionID,
    targetId: FactionID,
    type: TreatyType,
    proposerDiplomacy: number,
    proposerPersonality: Personality,
    powerRatio: number,
    commonEnemy: FactionID | null,
  ): { accepted: boolean; reason: string } {
    const baseChance = proposerDiplomacy / 100;

    const personalityModifiers: Record<string, number> = {
      AGGRESSIVE: -0.1, AMBITIOUS: 0.05, CALM: 0.1,
      CAUTIOUS: 0.05, LOYAL: 0.1, RIGHTEOUS: 0.15,
      GREEDY: -0.05, TIMID: 0.2,
    };
    const personMod = personalityModifiers[proposerPersonality] ?? 0;

    const typeModifiers: Record<TreatyType, number> = {
      NONE: 0, CEASEFIRE: 0.3, ALLIANCE: 0.1,
      VASSAL: -0.3, MILITARY_COALITION: -0.1,
    };
    const typeMod = typeModifiers[type] ?? 0;

    const powerMod = type === "VASSAL" ? (1 - powerRatio) * 0.3 : 0;
    const enemyBonus = commonEnemy ? 0.15 : 0;

    const chance = Math.max(0, Math.min(0.95, baseChance + personMod + typeMod + powerMod + enemyBonus));
    const roll = Math.random();
    const accepted = roll < chance;

    if (accepted) {
      const treaty: Treaty = {
        between: [proposerId, targetId],
        type,
        signedAt: Date.now(),
        duration: type === "CEASEFIRE" ? 12 : type === "ALLIANCE" ? 24 : type === "VASSAL" ? 36 : 6,
        terms: [],
      };
      this.treaties.push(treaty);
    }

    return {
      accepted,
      reason: accepted
        ? `조약이 체결되었다. (${(chance * 100).toFixed(0)}% 성공)`
        : `조약 체결에 실패했다. (${(chance * 100).toFixed(0)}% 확률)`,
    };
  }

  checkTreatyExpiry(): Treaty[] {
    const now = Date.now();
    const expired = this.treaties.filter((t) => now - t.signedAt > t.duration * 60000);
    this.treaties = this.treaties.filter((t) => !expired.includes(t));
    return expired;
  }

  breakTreaty(factionId: FactionID, treaty: Treaty): void {
    this.treaties = this.treaties.filter(
      (t) => t !== treaty,
    );
  }

  getActiveTreaties(factionId: FactionID): Treaty[] {
    return this.treaties.filter(
      (t) => t.between.includes(factionId),
    );
  }

  isAtWar(factionId: FactionID): boolean {
    return this.getActiveTreaties(factionId).some((t) => t.type === "MILITARY_COALITION");
  }

  formCoalitionAgainst(
    targetId: FactionID,
    proposerId: FactionID,
    potentialMembers: Array<{ id: FactionID; diplomacy: number; relationWithTarget: number }>,
  ): Treaty[] {
    const formed: Treaty[] = [];
    for (const member of potentialMembers) {
      if (member.id === proposerId) continue;
      if (member.relationWithTarget < -30) {
        const treaty: Treaty = {
          between: [proposerId, member.id],
          type: "MILITARY_COALITION",
          signedAt: Date.now(),
          duration: 12,
          terms: [`${targetId}에 대한 공동 전선`],
        };
        this.treaties.push(treaty);
        formed.push(treaty);
      }
    }
    return formed;
  }
}