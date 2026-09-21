import { describe, it, expect } from 'vitest';
import { buildWorld } from '../src/core/scenario_system.js';
import scenarioIndex from '../src/data/scenarios/index.json';

describe('시나리오 세력/도시 소유 매핑', () => {
    it('시나리오 05: 유비(idx 2) 선택 시 플레이어 세력은 fac_2', () => {
        const scenario = (scenarioIndex as Array<{ id: string; factions: Array<{ name: string; leader_id: string }> }>).find(s => s.id === '05')!;
        expect(scenario.factions[2].name).toBe('유비');

        const world = buildWorld(scenario as never, 2);
        const liuFaction = world.factions.find(f => f.leaderId === 'liu_bei')!;
        expect(liuFaction.id).toBe('fac_2');

        // 신야는 유비 수도 → fac_2 소유
        const xinye = world.cities.find(c => c.name === '신야')!;
        expect(xinye.ownerId).toBe('fac_2');
    });

    it('모든 도시의 소유 세력이 실제 존재하는 세력이다', () => {
        const scenario = (scenarioIndex as Array<{ id: string }>).find(s => s.id === '05')!;
        const world = buildWorld(scenario as never, 2);
        const factionIds = new Set(world.factions.map(f => f.id));
        for (const city of world.cities) {
            if (city.ownerId) {
                expect(factionIds.has(city.ownerId)).toBe(true);
            }
        }
    });
});
