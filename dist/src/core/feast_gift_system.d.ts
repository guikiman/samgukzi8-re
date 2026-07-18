import type { RelationshipEdge } from "./types";
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
    readonly affinityChanges: Array<{
        officerId: string;
        before: number;
        after: number;
        delta: number;
    }>;
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
export declare class FeastGiftSystem {
    private affinityStore;
    setAffinityStore(store: Map<string, Map<string, RelationshipEdge>>): void;
    private getAffinity;
    private modifyAffinity;
    giveGift(giverId: string, receiverId: string, gift: GiftItem, receiverPersonality: string): GiftResult;
    hostFeast(hostId: string, guestIds: string[], hostGold: number, feastQuality: "low" | "medium" | "high"): FeastResult | null;
    calculateRecruitmentChance(recruiterId: string, targetId: string, recruiterCharisma: number): number;
}
//# sourceMappingURL=feast_gift_system.d.ts.map