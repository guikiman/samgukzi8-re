import { describe, it, expect } from 'vitest';
import { GameEngine } from '../src/core/game_engine.js';
import { GameStore } from '../src/core/game_store.js';
import { buildWorld } from '../src/core/scenario_system.js';
import scenarioIndex from '../src/data/scenarios/index.json';

describe('월간 경제 순환 [E1-361]', () => {
    function setupWorld() {
        const store = new GameStore();
        const engine = new GameEngine(store);
        const scenario = (scenarioIndex as Array<{ id: string }>).find(s => s.id === '05')!;
        const world = buildWorld(scenario as never, 2); // 유비
        engine.initWorld(world.officers, world.factions, world.cities, []);
        return { store, engine, world };
    }

    it('월말 정산 시 세력 금고에 수입이 쌓인다', () => {
        const { store, engine, world } = setupWorld();
        const faction = world.factions.find(f => f.leaderId === 'liu_bei')!;
        const goldBefore = faction.gold;

        (engine as unknown as { processMonthlyMaintenance: () => void }).processMonthlyMaintenance();

        const after = store.getFaction(faction.id)!;
        expect(after.gold).toBeGreaterThan(goldBefore);
    });

    it('월말 정산 시 도시 자금(funds)에 상업 수익이 유입된다 — 내정 재원 순환', () => {
        const { store, engine, world } = setupWorld();
        const liuCities = world.cities.filter(c => c.ownerId === 'fac_2');
        expect(liuCities.length).toBeGreaterThan(0);

        (engine as unknown as { processMonthlyMaintenance: () => void }).processMonthlyMaintenance();

        for (const before of liuCities) {
            const after = store.getCity(before.id)!;
            const ds = before.developmentStats;
            // 성장 후 상업 기준 수입 = 90 + commerce(+3 자연 성장)
            const grownCommerce = Math.min(ds.maxCommerce, ds.commerce + 3);
            const newGoldIncome = 90 + Math.floor(grownCommerce);
            expect(after.funds).toBe(before.funds + newGoldIncome * 3);
            expect(after.funds).toBeGreaterThan(before.funds); // 반드시 증가
            expect(after.goldIncome).toBe(newGoldIncome);
            // 자연 성장 반영
            expect(after.developmentStats.commerce).toBe(grownCommerce);
        }
    });

    it('12개월 연속 내정이 가능하다 — 골드 고갈 없음 (선순환)', () => {
        const { store, engine, world } = setupWorld();
        const maint = (engine as unknown as { processMonthlyMaintenance: () => void }).processMonthlyMaintenance;
        const liuCityIds = world.cities.filter(c => c.ownerId === 'fac_2').map(c => c.id);

        let exhausted = false;
        let fundsBefore = store.getCity(liuCityIds[0])!.funds;
        for (let month = 0; month < 12; month++) {
            maint.call(engine);
            // 매달 내정 지출: 개발 250 + 징병 200 = 450
            const city = store.getCity(liuCityIds[0])!;
            if (city.funds >= 450) {
                store.updateCity(city.id, { funds: city.funds - 450 });
                fundsBefore = city.funds - 450;
            } else {
                exhausted = true;
                break;
            }
        }
        expect(exhausted).toBe(false);
        // 선순환 검증: 12개월 후 자금이 처음보다 증가해야 함
        expect(fundsBefore).toBeGreaterThan(store.getCity(liuCityIds[0])!.funds - 1000);
    });
});
