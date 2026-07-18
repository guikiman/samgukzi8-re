import type { ChildGenome } from "./child_genetics";
import type { Personality, OfficerID } from "./types";

export interface MentorAssignment {
  readonly childId: string;
  readonly mentorId: OfficerID;
  readonly mentorSkill: string;
  readonly startedAtTurn: number;
  readonly duration: number;
  progress: number;
}

export class MentorSystem {
  private assignments = new Map<string, MentorAssignment>();

  assignMentor(childId: string, mentor: { id: OfficerID; skills: string[] }, currentTurn: number): MentorAssignment | null {
    if (mentor.skills.length === 0) return null;
    const mentorSkill = mentor.skills[Math.floor(Math.random() * mentor.skills.length)];
    const assignment: MentorAssignment = {
      childId, mentorId: mentor.id, mentorSkill,
      startedAtTurn: currentTurn, duration: 12, progress: 0,
    };
    this.assignments.set(childId, assignment);
    return assignment;
  }

  calculateMentorBonus(mentorStats: { leadership: number; intelligence: number }, relevantStat: number): number {
    const avg = (mentorStats.leadership + mentorStats.intelligence) / 2;
    const diff = avg - relevantStat;
    return Math.max(1, Math.floor(diff / 10));
  }

  advanceProgress(childId: string): number {
    const assignment = this.assignments.get(childId);
    if (!assignment) return -1;
    assignment.progress = Math.min(1, assignment.progress + 1 / assignment.duration);
    if (assignment.progress >= 1) {
      this.assignments.delete(childId);
    }
    return assignment.progress;
  }

  getMentorSkillLearned(mentorSkill: string, childTalent: "genius" | "gifted" | "average" | "slow"): { learned: boolean; skill?: string } {
    const baseChance: Record<string, number> = {
      genius: 0.8, gifted: 0.6, average: 0.3, slow: 0.1,
    };
    const chance = baseChance[childTalent] ?? 0.3;
    const learned = Math.random() < chance;
    return learned ? { learned, skill: mentorSkill } : { learned };
  }

  getActiveMentorships(): MentorAssignment[] {
    return Array.from(this.assignments.values());
  }
}