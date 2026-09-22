import { describe, it, expect } from 'vitest';
import { GameStore } from '../src/core/game_store.js';
import { GameEngine } from '../src/core/game_engine.js';
import { buildWorld } from '../src/core/scenario_system.js';
import { computeSettlement, diffSettlement } from '../src/core/settlement_summary_system.js';
import scenarioIndex from '../src/data/scenarios/index.json';

describe('월말 정산 요약 [E1-361][461-480]', () => {
    it('시나리오 월드에서 세력별 수입·국고·병력·무장 스냅샷을 산출한다', () => {
        const scenario = (scenarioIndex as any[]).find(s => s.id === '05');
        const engine = new GameEngine(new GameStore());
        const world = buildWorld(scenario, 0);
        engine.initWorld(world.officers, world.factions, world.cities, []);
        const report = computeSettlement(engine['store']);

        expect(report.factions).toHaveLength(3);
        for (const f of report.factions) {
            expect(f.cityCount).toBeGreaterThan(0);
            expect(f.goldIncome).toBeGreaterThan(0);
            expect(f.foodIncome).toBeGreaterThan(0);
            expect(f.officerCount).toBeGreaterThan(0);
            expect(f.avgMorale).toBeGreaterThanOrEqual(0);
        }
        // 조조(fac_0) — 허창 단일 도시, 군주 포함
        const caocao = report.factions.find(f => f.factionId === 'fac_0');
        expect(caocao?.factionName).toBe('조조');
        expect(caocao?.cityCount).toBe(1);
    });

    it('국고·병량이 스냅샷에 정확히 반영된다', () => {
        const engine = new GameEngine(new GameStore());
        const scenario = (scenarioIndex as any[]).find(s => s.id === '05');
        const world = buildWorld(scenario, 0);
        engine.initWorld(world.officers, world.factions, world.cities, []);
        const store = engine['store'];
        const fac = store.getFaction('fac_0')!;
        store.updateFaction('fac_0', { gold: fac.gold + 500, food: fac.food + 2000 });

        const report = computeSettlement(store);
        const caocao = report.factions.find(f => f.factionId === 'fac_0')!;
        expect(caocao.gold).toBe(fac.gold + 500);
        expect(caocao.food).toBe(fac.food + 2000);
    });

    it('diffSettlement — 이전 스냅샷 대비 증감을 계산한다', () => {
        const prev = {
            factionId: 'fac_0', factionName: '조조', cityCount: 1,
            goldIncome: 100, foodIncome: 200, gold: 1000, food: 5000,
            troops: 8000, officerCount: 7, avgMorale: 70,
        };
        const curr = { ...prev, gold: 1200, food: 4800, troops: 7500, officerCount: 8 };
        const delta = diffSettlement(prev, curr);
        expect(delta).toEqual({ gold: 200, food: -200, troops: -500, officerCount: 1 });
    });

    it('diffSettlement — 이전 스냅샷이 없으면 0 기준(=현재값)', () => {
        const curr = {
            factionId: 'fac_1', factionName: '손권', cityCount: 1,
            goldIncome: 90, foodIncome: 180, gold: 600, food: 3000,
            troops: 5000, officerCount: 5, avgMorale: 65,
        };
        expect(diffSettlement(undefined, curr)).toEqual({
            gold: 600, food: 3000, troops: 5000, officerCount: 5,
        });
    });
});
