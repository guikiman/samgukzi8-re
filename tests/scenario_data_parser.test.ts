import { describe, it, expect, beforeEach } from 'vitest';
import { ScenarioDataParser } from '../src/core/scenario_data_parser';

describe('ScenarioDataParser', () => {
    let parser: ScenarioDataParser;

    beforeEach(() => {
        parser = new ScenarioDataParser();
    });

    it('should parse valid scenario', () => {
        const result = parser.parse({
            id: 'scenario_184', year: 184, name: '황건적의 난',
            factions: [{ factionId: 'faction_han', leaderId: 'off_ling', name: '한', color: '#FFD700', controlledCities: ['city_luoyang'], officers: ['off_ling'] }],
            neutralCities: ['city_changsha'],
            freeOfficers: ['off_zhuge'],
        });
        expect(result.success).toBe(true);
        expect(result.data).not.toBeNull();
        expect(result.data!.year).toBe(184);
    });

    it('should reject non-object data', () => {
        const result = parser.parse(null);
        expect(result.success).toBe(false);
    });

    it('should reject missing required fields', () => {
        const result = parser.parse({});
        expect(result.success).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid year', () => {
        const result = parser.parse({ id: 's1', year: 500, name: 'Test' });
        expect(result.success).toBe(false);
    });

    it('should get scenario by id', () => {
        parser.parse({ id: 's1', year: 190, name: 'Test' });
        const s = parser.getScenario('s1');
        expect(s).not.toBeNull();
    });

    it('should return null for unknown id', () => {
        expect(parser.getScenario('nonexistent')).toBeNull();
    });

    it('should get scenarios by year', () => {
        parser.parse({ id: 's1', year: 190, name: 'A' });
        parser.parse({ id: 's2', year: 190, name: 'B' });
        parser.parse({ id: 's3', year: 200, name: 'C' });
        expect(parser.getScenariosByYear(190).length).toBe(2);
    });

    it('should get all scenarios sorted', () => {
        parser.parse({ id: 's2', year: 200, name: 'B' });
        parser.parse({ id: 's1', year: 190, name: 'A' });
        const all = parser.getAllScenarios();
        expect(all.length).toBe(2);
    });

    it('should remove scenario', () => {
        parser.parse({ id: 's1', year: 190, name: 'Test' });
        expect(parser.removeScenario('s1')).toBe(true);
        expect(parser.count).toBe(0);
    });

    it('should clear all', () => {
        parser.parse({ id: 's1', year: 190, name: 'Test' });
        parser.clear();
        expect(parser.count).toBe(0);
    });
});
