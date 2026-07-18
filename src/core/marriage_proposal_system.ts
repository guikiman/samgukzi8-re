import type { Personality, OfficerID } from "./types";

export interface MarriageProposal {
  readonly proposerId: OfficerID;
  readonly targetId: OfficerID;
  readonly proposerCharisma: number;
  readonly targetAge: number;
  readonly proposerAge: number;
  readonly affinity: number;
  readonly targetPersonality: Personality;
  readonly mutualFaction: boolean;
  readonly proposerRank: number;
}

export class MarriageProposalSystem {
  canPropose(ctx: MarriageProposal): { allowed: boolean; reason?: string } {
    if (ctx.targetAge < 16) return { allowed: false, reason: "상대방이 너무年轻합니다." };
    if (ctx.proposerAge < 16) return { allowed: false, reason: "아직 혼인할 나이가 아닙니다." };
    if (ctx.targetAge > 50) return { allowed: false, reason: "상대방이 이미 혼인하기에 늦은 나이입니다." };
    return { allowed: true };
  }

  calculateSuccessChance(ctx: MarriageProposal): number {
    let chance = 0;
    const affinityFactor = ctx.affinity / 100;
    chance += affinityFactor * 0.4;
    const charismaFactor = ctx.proposerCharisma / 100;
    chance += charismaFactor * 0.2;
    const ageGap = Math.abs(ctx.proposerAge - ctx.targetAge);
    const ageFactor = Math.max(0, 1 - ageGap / 40);
    chance += ageFactor * 0.15;
    const personalityModifiers: Record<string, number> = {
      AMBITIOUS: 0.05, GREEDY: 0.08, LOYAL: -0.05, RIGHTEOUS: 0.02,
    };
    chance += personalityModifiers[ctx.targetPersonality] ?? 0;
    if (!ctx.mutualFaction) chance -= 0.2;
    return Math.max(0, Math.min(0.95, chance));
  }

  generateProposalOutcome(success: boolean, proposerName: string, targetName: string): { message: string; type: "accepted" | "rejected" | "furious" } {
    if (success) {
      return { message: `${targetName}이(가) ${proposerName}의 청혼을 받아들였다!`, type: "accepted" };
    }
    if (Math.random() < 0.2) {
      return { message: `${targetName}이(가) 분노하며 청혼을 일축했다! 친밀도가 크게 하락한다.`, type: "furious" };
    }
    return { message: `${targetName}이(가) 정중히 청혼을 거절했다.`, type: "rejected" };
  }
}