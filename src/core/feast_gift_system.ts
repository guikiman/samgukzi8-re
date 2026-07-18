import type { RelationshipEdge, RelationType } from "./types";

export interface GiftItem {
  readonly id: string;
  readonly name: string;
  readonly type: "weapon" | "treasure" | "book" | "mount" | "gold" | "food";
  readonly value: number;
  readonly affinityBonus: number;
}

export interface FeastResult {
  readonly hostId: string;
  readonly participants: string[];
  readonly totalCost: number;
  readonly affinityChanges: Array<{ officerId: string; before: number; after: number; delta: number }>;
  readonly incidents: string[];
}

export interface GiftResult {
  readonly giverId: string;
  readonly receiverId: string;
  readonly gift: GiftItem;
  readonly affinityBefore: number;
  readonly affinityAfter: number;
  readonly reaction: "delighted" | "pleased" | "neutral" | "insulted";
}

const PERSONALITY_GIFT_PREFERENCE: Record<string, string[]> = {
  AGGRESSIVE: ["weapon", "mount"],
  CALM: ["book", "treasure"],
  CAUTIOUS: ["treasure", "book"],
  TIMID: ["treasure", "gold"],
  LOYAL: ["weapon", "book"],
  AMBITIOUS: ["treasure", "gold"],
  RIGHTEOUS: ["book", "treasure"],
  GREEDY: ["gold", "treasure"],
};

export class FeastGiftSystem {
  private affinityStore: Map<string, Map<string, RelationshipEdge>> = new Map();

  setAffinityStore(store: Map<string, Map<string, RelationshipEdge>>): void {
    this.affinityStore = store;
  }

  private getAffinity(from: string, to: string): number {
    return this.affinityStore.get(from)?.get(to)?.affinity ?? 50;
  }

  private modifyAffinity(from: string, to: string, delta: number): number {
    const current = this.getAffinity(from, to);
    const newAffinity = Math.max(0, Math.min(100, current + delta));
    if (!this.affinityStore.has(from)) {
      this.affinityStore.set(from, new Map());
    }
    const existing = this.affinityStore.get(from)!.get(to) ?? {
      source: from, target: to, type: "FRIEND" as RelationType, affinity: 50, history: [],
    };
    existing.affinity = newAffinity;
    existing.history.push({ year: 0, month: 0, event: "feast_gift", delta });
    this.affinityStore.get(from)!.set(to, existing);
    return newAffinity;
  }

  giveGift(giverId: string, receiverId: string, gift: GiftItem, receiverPersonality: string): GiftResult {
    const before = this.getAffinity(giverId, receiverId);
    const preferences = PERSONALITY_GIFT_PREFERENCE[receiverPersonality] ?? ["treasure"];
    const isPreferred = preferences.includes(gift.type);

    const baseBonus = gift.affinityBonus;
    const personalityMultiplier = isPreferred ? 1.5 : 0.7;
    const valueMultiplier = Math.log2(gift.value + 1) / 10;
    const delta = Math.round(baseBonus * personalityMultiplier * (1 + valueMultiplier));

    this.modifyAffinity(giverId, receiverId, delta);
    const after = this.getAffinity(giverId, receiverId);

    let reaction: GiftResult["reaction"];
    if (delta >= 15) reaction = "delighted";
    else if (delta >= 8) reaction = "pleased";
    else if (delta >= 3) reaction = "neutral";
    else reaction = "insulted";

    return { giverId, receiverId, gift, affinityBefore: before, affinityAfter: after, reaction };
  }

  hostFeast(hostId: string, guestIds: string[], hostGold: number, feastQuality: "low" | "medium" | "high"): FeastResult | null {
    const costMap = { low: 50, medium: 200, high: 500 };
    const totalCost = costMap[feastQuality] * guestIds.length;

    if (hostGold < totalCost) return null;

    const affinityChanges: FeastResult["affinityChanges"] = [];
    const incidents: string[] = [];
    const participants: string[] = [];

    const baseDelta = { low: 2, medium: 5, high: 10 };

    for (const guestId of guestIds) {
      const before = this.getAffinity(hostId, guestId);
      const delta = baseDelta[feastQuality] + Math.floor(Math.random() * 5);
      const after = this.modifyAffinity(hostId, guestId, delta);
      affinityChanges.push({ officerId: guestId, before, after, delta });
      participants.push(guestId);

      if (Math.random() < 0.1) {
        const incidentTexts = [
          `${guestId}가 과음하여 자리에서 쓰러졌다.`,
          `${guestId}와 다른 손님이 말다툼을 벌였다.`,
          `${guestId}가 노래를 부르며 흥을 돋웠다.`,
        ];
        incidents.push(incidentTexts[Math.floor(Math.random() * incidentTexts.length)]);
      }
    }

    return { hostId, participants, totalCost, affinityChanges, incidents };
  }

  calculateRecruitmentChance(recruiterId: string, targetId: string, recruiterCharisma: number): number {
    const affinity = this.getAffinity(recruiterId, targetId);
    const baseChance = 0.1 + (affinity / 100) * 0.5;
    const charismaBonus = recruiterCharisma / 200;
    return Math.min(0.95, baseChance + charismaBonus);
  }
}