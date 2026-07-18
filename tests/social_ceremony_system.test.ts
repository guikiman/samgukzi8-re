import { describe, it, expect, beforeEach } from 'vitest';
import { SocialCeremonyManager } from '../src/core/social_ceremony_system';

describe('SocialCeremonyManager', () => {
    let manager: SocialCeremonyManager;

    beforeEach(() => {
        manager = new SocialCeremonyManager();
    });

    it('should return gift definition', () => {
        const gift = manager.getGift('rare_sword');
        expect(gift).not.toBeUndefined();
        expect(gift!.affectionBonus).toBe(25);
    });

    it('should return undefined for unknown gift', () => {
        expect(manager.getGift('unknown')).toBeUndefined();
    });

    it('should return all gifts', () => {
        expect(manager.getAllGifts().length).toBeGreaterThan(0);
    });

    it('should give gift and increase affection', () => {
        const result = manager.giveGift('off_1', 'off_2', 'fine_horse');
        expect(result.success).toBe(true);
        expect(result.affectionDelta).toBe(30);
    });

    it('should fail gift with unknown item', () => {
        const result = manager.giveGift('off_1', 'off_2', 'unknown_item');
        expect(result.success).toBe(false);
    });

    it('should host a banquet', () => {
        const results = manager.hostBanquet('off_1', ['off_2', 'off_3'], 500);
        expect(results.length).toBe(2);
        expect(results.every(r => r.success)).toBe(true);
    });

    it('should propose sworn brother with high affection', () => {
        const result = manager.proposeSwornBrother('off_1', 'off_2', 95);
        expect(result.success).toBe(true);
    });

    it('should reject sworn brother with low affection', () => {
        const result = manager.proposeSwornBrother('off_1', 'off_2', 50);
        expect(result.success).toBe(false);
    });

    it('should reject duplicate sworn brother', () => {
        manager.proposeSwornBrother('off_1', 'off_2', 95);
        const result = manager.proposeSwornBrother('off_1', 'off_2', 95);
        expect(result.success).toBe(false);
    });

    it('should propose marriage with high affection', () => {
        const result = manager.proposeMarriage('off_1', 'off_2', 98);
        expect(result.success).toBe(true);
    });

    it('should reject marriage with low affection', () => {
        const result = manager.proposeMarriage('off_1', 'off_2', 50);
        expect(result.success).toBe(false);
    });

    it('should visit and increase affection slightly', () => {
        const result = manager.visit('off_1', 'off_2');
        expect(result.success).toBe(true);
        expect(result.affectionDelta).toBe(3);
    });

    it('should check sworn brother status', () => {
        manager.proposeSwornBrother('off_1', 'off_2', 95);
        expect(manager.isSwornBrother('off_1', 'off_2')).toBe(true);
        expect(manager.isSwornBrother('off_1', 'off_3')).toBe(false);
    });

    it('should check marriage status', () => {
        manager.proposeMarriage('off_1', 'off_2', 98);
        expect(manager.isMarried('off_1', 'off_2')).toBe(true);
    });
});
