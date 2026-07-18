import { describe, it, expect, beforeEach } from 'vitest';
import { OfficerBiographyStore } from '../src/core/officer_biography_store';

describe('OfficerBiographyStore', () => {
    let store: OfficerBiographyStore;

    beforeEach(() => {
        store = new OfficerBiographyStore();
        store.addOfficer({ id: 'off_guan', name: '관우', chineseName: '關羽', aliases: ['운장'], birthYear: 160, deathYear: 220, biography: '의형제 관운장', personality: 'LOYAL', skills: ['BLADE', 'CAVALRY'] });
        store.addOfficer({ id: 'off_zhang', name: '장비', chineseName: '張飛', aliases: ['익덕'], birthYear: 165, deathYear: 221, biography: '맹장 장비', personality: 'BRAVE', skills: ['SPEAR', 'INTIMIDATE'] });
        store.addOfficer({ id: 'off_zhuge', name: '제갈량', chineseName: '諸葛亮', aliases: ['공명'], birthYear: 181, deathYear: 234, biography: '와룡 제갈량', personality: 'WISE', skills: ['STRATEGY', 'DIPLOMACY'] });
    });

    it('should get officer by id', () => {
        const off = store.getOfficer('off_guan');
        expect(off).not.toBeNull();
        expect(off!.name).toBe('관우');
    });

    it('should return null for unknown id', () => {
        expect(store.getOfficer('nonexistent')).toBeNull();
    });

    it('should search by name', () => {
        const results = store.searchByName('관우');
        expect(results.length).toBe(1);
    });

    it('should search by alias', () => {
        const results = store.searchByName('운장');
        expect(results.length).toBe(1);
    });

    it('should get all officers', () => {
        expect(store.getAllOfficers().length).toBe(3);
    });

    it('should get officers by personality', () => {
        expect(store.getOfficersByPersonality('LOYAL').length).toBe(1);
    });

    it('should get officers alive in year', () => {
        const alive = store.getOfficersAliveInYear(200);
        expect(alive.length).toBe(3);
    });

    it('should detect natural deaths', () => {
        const deaths = store.checkNaturalDeaths(220);
        expect(deaths.length).toBe(1);
        expect(deaths[0].name).toBe('관우');
    });

    it('should have death history', () => {
        store.checkNaturalDeaths(220);
        expect(store.getDeathHistory().length).toBe(1);
    });

    it('should calculate age', () => {
        expect(store.calculateAge('off_guan', 190)).toBe(30);
    });

    it('should check if alive', () => {
        expect(store.isAlive('off_guan', 200)).toBe(true);
        expect(store.isAlive('off_guan', 230)).toBe(false);
    });

    it('should remove officer', () => {
        expect(store.removeOfficer('off_guan')).toBe(true);
        expect(store.count).toBe(2);
    });

    it('should clear all', () => {
        store.clear();
        expect(store.count).toBe(0);
    });
});
