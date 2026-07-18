import type { OfficerID } from "./types";

export interface SpouseBonus {
  readonly combatSync: number;
  readonly domesticBonus: number;
  readonly loyaltyBonus: number;
  readonly childBonus: number;
}

export class SpouseSynergySystem {
  calculateCombatSync(husbandMight: number, wifeMight: number, marriageDuration: number): number {
    const base = (husbandMight + wifeMight) / 200;
    const durationBonus = Math.min(0.15, marriageDuration * 0.005);
    return Math.min(0.4, base * 0.2 + durationBonus);
  }

  calculateDomesticBonus(husbandPolitics: number, wifePolitics: number, marriageDuration: number): number {
    const base = (husbandPolitics + wifePolitics) / 200;
    const durationBonus = Math.min(0.1, marriageDuration * 0.003);
    return Math.min(0.3, base * 0.15 + durationBonus);
  }

  calculateLoyaltyBonus(marriageDuration: number, hasChildren: boolean): number {
    let bonus = marriageDuration * 0.5;
    if (hasChildren) bonus += 10;
    return Math.min(25, bonus);
  }

  getSpouseBonus(
    selfStats: { might: number; politics: number },
    spouseStats: { might: number; politics: number },
    marriageDuration: number,
    hasChildren: boolean,
  ): SpouseBonus {
    return {
      combatSync: this.calculateCombatSync(selfStats.might, spouseStats.might, marriageDuration),
      domesticBonus: this.calculateDomesticBonus(selfStats.politics, spouseStats.politics, marriageDuration),
      loyaltyBonus: this.calculateLoyaltyBonus(marriageDuration, hasChildren),
      childBonus: hasChildren ? 0.1 : 0,
    };
  }

  calculateJointBattleDamage(baseDamage: number, combatSync: number): number {
    return Math.round(baseDamage * (1 + combatSync));
  }
}