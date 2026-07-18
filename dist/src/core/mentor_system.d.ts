import type { OfficerID } from "./types";
export interface MentorAssignment {
    readonly childId: string;
    readonly mentorId: OfficerID;
    readonly mentorSkill: string;
    readonly startedAtTurn: number;
    readonly duration: number;
    progress: number;
}
export declare class MentorSystem {
    private assignments;
    assignMentor(childId: string, mentor: {
        id: OfficerID;
        skills: string[];
    }, currentTurn: number): MentorAssignment | null;
    calculateMentorBonus(mentorStats: {
        leadership: number;
        intelligence: number;
    }, relevantStat: number): number;
    advanceProgress(childId: string): number;
    getMentorSkillLearned(mentorSkill: string, childTalent: "genius" | "gifted" | "average" | "slow"): {
        learned: boolean;
        skill?: string;
    };
    getActiveMentorships(): MentorAssignment[];
}
//# sourceMappingURL=mentor_system.d.ts.map