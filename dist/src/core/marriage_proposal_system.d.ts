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
export declare class MarriageProposalSystem {
    canPropose(ctx: MarriageProposal): {
        allowed: boolean;
        reason?: string;
    };
    calculateSuccessChance(ctx: MarriageProposal): number;
    generateProposalOutcome(success: boolean, proposerName: string, targetName: string): {
        message: string;
        type: "accepted" | "rejected" | "furious";
    };
}
//# sourceMappingURL=marriage_proposal_system.d.ts.map