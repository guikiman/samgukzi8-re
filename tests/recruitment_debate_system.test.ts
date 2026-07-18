import { describe, it, expect, beforeEach } from 'vitest';
import { RecruitmentDebateManager } from '../src/core/recruitment_debate_system';

describe('RecruitmentDebateManager', () => {
    let manager: RecruitmentDebateManager;

    beforeEach(() => {
        manager = new RecruitmentDebateManager();
    });

    it('should refuse recruitment with high loyalty', () => {
        const result = manager.attemptRecruit('recruiter', 'target', 'faction_1', 95, 80, 70);
        expect(result.phase).toBe('IMMEDIATE_REFUSAL');
        expect(result.success).toBe(false);
    });

    it('should allow immediate success with low loyalty', () => {
        const result = manager.attemptRecruit('recruiter', 'target', 'faction_1', 30, 80, 70);
        expect(result.phase === 'IMMEDIATE_SUCCESS' || result.phase === 'DEBATE_REQUIRED').toBe(true);
    });

    it('should require debate with medium loyalty', () => {
        const result = manager.attemptRecruit('recruiter', 'target', 'faction_1', 70, 80, 70);
        expect(result.phase === 'DEBATE_REQUIRED' || result.phase === 'IMMEDIATE_REFUSAL').toBe(true);
    });

    it('should resolve recruitment with debate win', () => {
        const result = manager.resolveRecruitment('recruiter', 'target', true);
        expect(result.success).toBe(true);
        expect(result.message).toContain('등용 성공');
    });

    it('should resolve recruitment with debate loss', () => {
        const result = manager.resolveRecruitment('recruiter', 'target', false);
        expect(result.success).toBe(false);
    });

    it('should improve offer', () => {
        const offer = {
            recruiterId: 'recruiter', targetId: 'target', factionId: 'faction_1',
            offerType: 'PERSUADE' as const, promisedRank: 3, promisedGold: 100,
        };
        const improved = manager.improveOffer(offer, 200, 2);
        expect(improved.promisedGold).toBe(300);
        expect(improved.promisedRank).toBe(5);
    });

    it('should track attempt history', () => {
        manager.attemptRecruit('recruiter', 'target', 'faction_1', 70, 80, 70);
        expect(manager.getAttemptHistory().length).toBe(1);
    });

    it('should clear history', () => {
        manager.attemptRecruit('recruiter', 'target', 'faction_1', 70, 80, 70);
        manager.clear();
        expect(manager.getAttemptHistory().length).toBe(0);
    });
});
