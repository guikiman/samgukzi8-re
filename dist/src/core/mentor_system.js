export class MentorSystem {
    constructor() {
        this.assignments = new Map();
    }
    assignMentor(childId, mentor, currentTurn) {
        if (mentor.skills.length === 0)
            return null;
        const mentorSkill = mentor.skills[Math.floor(Math.random() * mentor.skills.length)];
        const assignment = {
            childId, mentorId: mentor.id, mentorSkill,
            startedAtTurn: currentTurn, duration: 12, progress: 0,
        };
        this.assignments.set(childId, assignment);
        return assignment;
    }
    calculateMentorBonus(mentorStats, relevantStat) {
        const avg = (mentorStats.leadership + mentorStats.intelligence) / 2;
        const diff = avg - relevantStat;
        return Math.max(1, Math.floor(diff / 10));
    }
    advanceProgress(childId) {
        const assignment = this.assignments.get(childId);
        if (!assignment)
            return -1;
        assignment.progress = Math.min(1, assignment.progress + 1 / assignment.duration);
        if (assignment.progress >= 1) {
            this.assignments.delete(childId);
        }
        return assignment.progress;
    }
    getMentorSkillLearned(mentorSkill, childTalent) {
        const baseChance = {
            genius: 0.8, gifted: 0.6, average: 0.3, slow: 0.1,
        };
        const chance = baseChance[childTalent] ?? 0.3;
        const learned = Math.random() < chance;
        return learned ? { learned, skill: mentorSkill } : { learned };
    }
    getActiveMentorships() {
        return Array.from(this.assignments.values());
    }
}
//# sourceMappingURL=mentor_system.js.map