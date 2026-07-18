import { describe, it, expect, beforeEach } from 'vitest';
import { GraveyardStore } from '../src/core/graveyard_store';

describe('GraveyardStore', () => {
    let store: GraveyardStore;

    beforeEach(() => {
        store = new GraveyardStore();
    });

    it('should bury and retrieve a deceased officer', () => {
        store.bury('off_1', '조조', { leadership: 95, might: 60, intelligence: 90, politics: 85, charisma: 80 },
            'faction_wei', 220, 3, 'DISEASE', 66, '위나라 창시자', ['북중국 통일']);
        const record = store.getRecord('off_1');
        expect(record).toBeDefined();
        expect(record!.name).toBe('조조');
        expect(record!.deathCause).toBe('DISEASE');
    });

    it('should return undefined for non-existent officer', () => {
        expect(store.getRecord('nonexistent')).toBeUndefined();
    });

    it('should query records by year', () => {
        store.bury('off_1', 'A', { leadership: 50, might: 50, intelligence: 50, politics: 50, charisma: 50 },
            null, 220, 1, 'BATTLE', 45);
        store.bury('off_2', 'B', { leadership: 50, might: 50, intelligence: 50, politics: 50, charisma: 50 },
            null, 221, 1, 'OLD_AGE', 70);
        const year220 = store.getRecordsByYear(220);
        expect(year220.length).toBe(1);
        expect(year220[0].officerId).toBe('off_1');
    });

    it('should query records by faction', () => {
        store.bury('off_1', 'A', { leadership: 50, might: 50, intelligence: 50, politics: 50, charisma: 50 },
            'wei', 220, 1, 'BATTLE', 45);
        store.bury('off_2', 'B', { leadership: 50, might: 50, intelligence: 50, politics: 50, charisma: 50 },
            'shu', 221, 1, 'BATTLE', 50);
        const weiRecords = store.getRecordsByFaction('wei');
        expect(weiRecords.length).toBe(1);
    });

    it('should query records by cause', () => {
        store.bury('off_1', 'A', { leadership: 50, might: 50, intelligence: 50, politics: 50, charisma: 50 },
            null, 220, 1, 'BATTLE', 45);
        store.bury('off_2', 'B', { leadership: 50, might: 50, intelligence: 50, politics: 50, charisma: 50 },
            null, 221, 1, 'OLD_AGE', 70);
        const battleDeaths = store.getRecordsByCause('BATTLE');
        expect(battleDeaths.length).toBe(1);
    });

    it('should purge old records', () => {
        store.bury('off_1', 'A', { leadership: 50, might: 50, intelligence: 50, politics: 50, charisma: 50 },
            null, 200, 1, 'BATTLE', 30);
        store.bury('off_2', 'B', { leadership: 50, might: 50, intelligence: 50, politics: 50, charisma: 50 },
            null, 220, 1, 'BATTLE', 50);
        const removed = store.purgeOldRecords(210);
        expect(removed).toBe(1);
        expect(store.getDeathCount()).toBe(1);
    });

    it('should track total death count', () => {
        expect(store.getTotalDeathCount()).toBe(0);
        store.bury('off_1', 'A', { leadership: 50, might: 50, intelligence: 50, politics: 50, charisma: 50 },
            null, 220, 1, 'BATTLE', 45);
        expect(store.getTotalDeathCount()).toBe(1);
    });

    it('should include killer info when provided', () => {
        store.bury('off_1', '하후돈', { leadership: 80, might: 85, intelligence: 60, politics: 50, charisma: 60 },
            'wei', 220, 1, 'BATTLE', 55, '', [], 'off_killer', '관우');
        const record = store.getRecord('off_1')!;
        expect(record.killerId).toBe('off_killer');
        expect(record.killerName).toBe('관우');
    });
});
