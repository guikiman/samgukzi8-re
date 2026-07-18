import { describe, it, expect, beforeEach } from 'vitest';
import { ClanHonorStore, ClanRank } from '../src/core/clan_honor_store';

describe('ClanHonorStore', () => {
    let store: ClanHonorStore;

    beforeEach(() => {
        store = new ClanHonorStore();
    });

    it('should register a clan', () => {
        const clan = store.registerClan('clan_1', '조씨 가문', 'off_cao_cao', 200);
        expect(clan.name).toBe('조씨 가문');
        expect(clan.founderId).toBe('off_cao_cao');
    });

    it('should get clan by ID', () => {
        store.registerClan('clan_1', '조씨', 'off_cao_cao', 200);
        const clan = store.getClan('clan_1');
        expect(clan).toBeDefined();
        expect(clan!.name).toBe('조씨');
    });

    it('should add and remove members', () => {
        store.registerClan('clan_1', '조씨', 'off_cao_cao', 200);
        expect(store.addMember('clan_1', 'off_cao_pi')).toBe(true);
        const clan = store.getClan('clan_1')!;
        expect(clan.memberIds).toContain('off_cao_pi');
        expect(store.removeMember('clan_1', 'off_cao_pi')).toBe(true);
    });

    it('should earn and track honor', () => {
        store.registerClan('clan_1', '조씨', 'off_cao_cao', 200);
        store.earnHonor('clan_1', 50, '전투승리', 1, 200, 1, 'off_cao_cao');
        expect(store.getTotalHonor('clan_1')).toBe(50);
    });

    it('should spend honor', () => {
        store.registerClan('clan_1', '조씨', 'off_cao_cao', 200);
        store.earnHonor('clan_1', 100, '시작', 1, 200, 1);
        const result = store.spendHonor('clan_1', 30, '아이템구매', 2, 200, 2);
        expect(result.success).toBe(true);
        expect(result.newTotal).toBe(70);
    });

    it('should reject spending more than available', () => {
        store.registerClan('clan_1', '조씨', 'off_cao_cao', 200);
        const result = store.spendHonor('clan_1', 100, '과소비', 1, 200, 1);
        expect(result.success).toBe(false);
    });

    it('should calculate rank correctly', () => {
        expect(store.calculateRank(0)).toBe(ClanRank.UNKNOWN);
        expect(store.calculateRank(100)).toBe(ClanRank.NOBLE);
        expect(store.calculateRank(500)).toBe(ClanRank.KNIGHT);
        expect(store.calculateRank(2000)).toBe(ClanRank.COUNT);
        expect(store.calculateRank(5000)).toBe(ClanRank.ROYAL);
    });

    it('should get top clans', () => {
        store.registerClan('c1', '조씨', 'off_1', 200);
        store.registerClan('c2', '유씨', 'off_2', 200);
        store.earnHonor('c1', 100, '전투', 1, 200, 1);
        store.earnHonor('c2', 200, '전투', 1, 200, 1);
        const top = store.getTopClans(1);
        expect(top.length).toBe(1);
        expect(top[0].name).toBe('유씨');
    });

    it('should remove a clan', () => {
        store.registerClan('clan_1', '조씨', 'off_1', 200);
        expect(store.removeClan('clan_1')).toBe(true);
        expect(store.getClan('clan_1')).toBeUndefined();
    });
});
