import { describe, it, expect, beforeEach } from 'vitest';
import { DynamicFactionBalancer } from '../src/core/dynamic_faction_balancer';

describe('DynamicFactionBalancer', () => {
    let balancer: DynamicFactionBalancer;

    beforeEach(() => {
        balancer = new DynamicFactionBalancer();
    });

    it('should update metrics', () => {
        balancer.updateMetrics([
            { factionId: 'faction_wei', officerCount: 50, cityCount: 20, totalDevelopment: 800, totalSoldiers: 50000, totalGold: 10000, totalFood: 50000, powerRank: 100 },
            { factionId: 'faction_shu', officerCount: 25, cityCount: 10, totalDevelopment: 400, totalSoldiers: 25000, totalGold: 5000, totalFood: 25000, powerRank: 50 },
        ]);
        expect(balancer.getAllMetrics().length).toBe(2);
    });

    it('should give bonus to weak faction', () => {
        balancer.updateMetrics([
            { factionId: 'faction_wei', officerCount: 50, cityCount: 20, totalDevelopment: 800, totalSoldiers: 50000, totalGold: 10000, totalFood: 50000, powerRank: 100 },
            { factionId: 'faction_shu', officerCount: 5, cityCount: 2, totalDevelopment: 50, totalSoldiers: 5000, totalGold: 1000, totalFood: 5000, powerRank: 10 },
        ]);
        const bonus = balancer.getBonus('faction_shu');
        expect(bonus).not.toBeNull();
        expect(bonus!.recruitmentBonus).toBeGreaterThan(1.0);
    });

    it('should apply penalty to dominant faction', () => {
        balancer.updateMetrics([
            { factionId: 'faction_wei', officerCount: 80, cityCount: 30, totalDevelopment: 1500, totalSoldiers: 100000, totalGold: 50000, totalFood: 200000, powerRank: 200 },
            { factionId: 'faction_shu', officerCount: 20, cityCount: 8, totalDevelopment: 300, totalSoldiers: 20000, totalGold: 4000, totalFood: 20000, powerRank: 40 },
        ]);
        const bonus = balancer.getBonus('faction_wei');
        expect(bonus).not.toBeNull();
        expect(bonus!.diplomacyBonus).toBeLessThan(1.0);
    });

    it('should return null for unknown faction', () => {
        expect(balancer.getBonus('nonexistent')).toBeNull();
    });

    it('should clear all', () => {
        balancer.updateMetrics([
            { factionId: 'faction_wei', officerCount: 50, cityCount: 20, totalDevelopment: 800, totalSoldiers: 50000, totalGold: 10000, totalFood: 50000, powerRank: 100 },
        ]);
        balancer.clear();
        expect(balancer.getAllMetrics().length).toBe(0);
    });
});
