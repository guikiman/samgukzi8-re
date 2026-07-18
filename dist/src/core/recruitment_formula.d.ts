import type { Personality } from "./types";
export interface RecruitmentContext {
    recruiterId: string;
    recruiterCharisma: number;
    recruiterFactionPower: number;
    recruiterFactionCityCount: number;
    targetId: string;
    targetLoyalty: number;
    targetAmbition: number;
    targetPersonality: Personality;
    currentFactionPower: number;
    affinity: number;
    hasSwornBrotherhood: boolean;
    isRival: boolean;
    giftBonus: number;
}
export declare function calculateRecruitmentChance(ctx: RecruitmentContext): {
    chance: number;
    breakdown: {
        factor: string;
        weight: number;
        contribution: number;
    }[];
};
export declare function calculateDetectChance(intelligence: number, spymaster: {
    name: string;
    intelligence: number;
}): number;
export declare function generateRecruitmentEvent(success: boolean, targetName: string, recruiterName: string): {
    message: string;
    type: "success" | "failure" | "critical_failure";
};
//# sourceMappingURL=recruitment_formula.d.ts.map