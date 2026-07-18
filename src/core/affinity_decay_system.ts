/**
 * [Task 22] 친밀도 자연 감소/증가 시스템 — AffinityDecaySystem
 *
 * 성격 궁합, 거리, 시간에 따른 자연스러운 친밀도 변화.
 */

import type { Officer, Personality } from "./types.js";

export interface AffinityDecayConfig {
  readonly baseDecayPerTurn: number;
  readonly maxAffinity: number;
  readonly minAffinity: number;
  readonly interactionBoostDecay: number;
  readonly distanceDecayFactor: number;
}

const DEFAULT_CONFIG: AffinityDecayConfig = {
  baseDecayPerTurn: 1,
  maxAffinity: 100,
  minAffinity: -100,
  interactionBoostDecay: 0.5,
  distanceDecayFactor: 0.1,
};

export class AffinityDecaySystem {
  private config: AffinityDecayConfig;
  private compatibility: Map<Personality, Map<Personality, number>> = new Map();

  constructor(config?: Partial<AffinityDecayConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.resetToDefault();
  }

  resetToDefault(): void {
    this.compatibility.clear();
    const p: Personality[] = ["AGGRESSIVE", "CALM", "CAUTIOUS", "TIMID", "LOYAL", "AMBITIOUS", "RIGHTEOUS", "GREEDY"];
    for (const a of p) {
      const row = new Map<Personality, number>();
      for (const b of p) row.set(b, 0);
      this.compatibility.set(a, row);
    }
    this.set("AGGRESSIVE", "AGGRESSIVE", -1);
    this.set("AGGRESSIVE", "CALM", 1);
    this.set("AGGRESSIVE", "CAUTIOUS", -0.5);
    this.set("AGGRESSIVE", "TIMID", -1.5);
    this.set("AGGRESSIVE", "LOYAL", 0.5);
    this.set("AGGRESSIVE", "AMBITIOUS", 1.5);
    this.set("AGGRESSIVE", "RIGHTEOUS", 0.5);
    this.set("AGGRESSIVE", "GREEDY", -0.5);
    this.set("CALM", "CALM", 1);
    this.set("CALM", "CAUTIOUS", 1.5);
    this.set("CALM", "TIMID", 0.5);
    this.set("CALM", "LOYAL", 1);
    this.set("CALM", "AMBITIOUS", -0.5);
    this.set("CALM", "RIGHTEOUS", 1);
    this.set("CALM", "GREEDY", -1);
    this.set("CAUTIOUS", "CAUTIOUS", 1);
    this.set("CAUTIOUS", "TIMID", 0.5);
    this.set("CAUTIOUS", "LOYAL", 0.5);
    this.set("CAUTIOUS", "AMBITIOUS", -1);
    this.set("CAUTIOUS", "RIGHTEOUS", 0.5);
    this.set("CAUTIOUS", "GREEDY", -0.5);
    this.set("TIMID", "TIMID", 0.5);
    this.set("TIMID", "LOYAL", 0.5);
    this.set("TIMID", "AMBITIOUS", -1.5);
    this.set("TIMID", "RIGHTEOUS", 0.5);
    this.set("TIMID", "GREEDY", -0.5);
    this.set("LOYAL", "LOYAL", 2);
    this.set("LOYAL", "AMBITIOUS", -1.5);
    this.set("LOYAL", "RIGHTEOUS", 1.5);
    this.set("LOYAL", "GREEDY", -1);
    this.set("AMBITIOUS", "AMBITIOUS", -1);
    this.set("AMBITIOUS", "RIGHTEOUS", -1.5);
    this.set("AMBITIOUS", "GREEDY", 1.5);
    this.set("RIGHTEOUS", "RIGHTEOUS", 2);
    this.set("RIGHTEOUS", "GREEDY", -2);
    this.set("GREEDY", "GREEDY", -1);
  }

  private set(a: Personality, b: Personality, value: number): void {
    this.compatibility.get(a)?.set(b, value);
    this.compatibility.get(b)?.set(a, value);
  }

  setCustomCompatibility(a: Personality, b: Personality, factor: number): void {
    this.set(a, b, factor);
  }

  getCompatibilityFactor(a: Officer, b: Officer): number {
    return this.compatibility.get(a.personality)?.get(b.personality) ?? 0;
  }

  calculateDecay(
    officerA: Officer,
    officerB: Officer,
    currentAffinity: number,
    turnsSinceLastInteraction: number,
  ): number {
    const { baseDecayPerTurn, maxAffinity, minAffinity, interactionBoostDecay, distanceDecayFactor } = this.config;

    let decay = 0;
    if (currentAffinity > 0) {
      decay = -baseDecayPerTurn;
    } else if (currentAffinity < 0) {
      decay = baseDecayPerTurn * 0.5;
    }

    const compatibilityFactor = this.getCompatibilityFactor(officerA, officerB);
    decay *= 1 + Math.abs(compatibilityFactor) * 0.2;

    if (officerA.cityId !== officerB.cityId) {
      decay *= 1 + distanceDecayFactor;
    }

    if (turnsSinceLastInteraction < 5 && currentAffinity > 0) {
      decay += (5 - turnsSinceLastInteraction) * interactionBoostDecay;
    }

    if (compatibilityFactor > 0 && currentAffinity < 50) {
      decay += compatibilityFactor * 0.5;
    } else if (compatibilityFactor < 0 && currentAffinity > -50) {
      decay += compatibilityFactor * 0.3;
    }

    const projected = currentAffinity + decay;
    if (projected > maxAffinity) decay = maxAffinity - currentAffinity;
    if (projected < minAffinity) decay = minAffinity - currentAffinity;

    return decay;
  }
}
