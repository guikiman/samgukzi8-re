import { describe, it, expect } from 'vitest';
import { GameStore } from '../src/core/game_store.js';
import { GameEngine } from '../src/core/game_engine.js';
import { buildWorld } from '../src/core/scenario_system.js';
import {
    processHellConstraints,
    isHellDifficulty,
    HELL_TAX_LEAK,
} from '../src/core/hell_constraint_system.js';
import scenarioIndex from '../src/data/scenarios/index.json';

function makeEngine(difficulty?: number): { engine: GameEngine; store: GameStore } {
    const scenario = (scenarioIndex as any[]).find(s => s.id === '05');
    const engine = new GameEngine(new GameStore());
    const world = buildWorld(scenario, 0);
    engine.initWorld(world.officers, world.factions, world.cities, []);
    if (difficulty !== undefined) {
        engine['store'].setGlobalState({ difficulty });
    }
    return { engine, store: engine['store'] };
}

describe('지옥 난이도 제약 [X-난이도]', () => {
    it('난이도 1~4에서는 완전히 비활성화 — 리포트가 빈 상태로 유지된다', () => {
        for (const d of [1, 2, 3, 4]) {
            const { store } = makeEngine(d);
            expect(isHellDifficulty(store)).toBe(false);
            const report = processHellConstraints(store, () => 0);
            expect(report.taxLeaked).toBe(0);
            expect(report.deserted).toHaveLength(0);
            expect(report.revolted).toHaveLength(0);
        }
    });

    it('difficulty 미지정(구버전)에서도 비활성화', () => {
        const { store } = makeEngine(undefined);
        expect(isHellDifficulty(store)).toBe(false);
        const report = processHellConstraints(store, () => 0);
        expect(report.taxLeaked).toBe(0);
    });

    it('지옥 난이도 — 도시 세수 20%가 유실된다', () => {
        const { store } = makeEngine(5);
        expect(isHellDifficulty(store)).toBe(true);
        const before = store.getAllCities().map(c => ({ id: c.id, income: c.goldIncome }));
        const report = processHellConstraints(store, () => 0.99);
        const expectedLeak = before.reduce((s, c) => s + Math.floor(c.income * HELL_TAX_LEAK), 0);
        expect(report.taxLeaked).toBe(expectedLeak);
        expect(report.taxLeaked).toBeGreaterThan(0);
        for (const c of before) {
            const after = store.getCity(c.id)!;
            expect(after.goldIncome).toBe(c.income - Math.floor(c.income * HELL_TAX_LEAK));
        }
    });

    it('지옥 난이도 — 충성도 0 무장이 random=0이면 반드시 탈영한다', () => {
        const { store } = makeEngine(5);
        // 군주가 아닌 무장의 충성도를 0으로
        const faction = store.getFaction('fac_0')!;
        const nonLeader = faction.officers.find(id => id !== faction.leaderId)!;
        store.updateOfficer(nonLeader, { loyalty: 0 });
        const report = processHellConstraints(store, () => 0);
        expect(report.deserted.some(d => d.officerId === nonLeader)).toBe(true);
        const off = store.getOfficer(nonLeader)!;
        expect(off.factionId).toBeNull();
        expect(off.status).toBe('FREE');
    });

    it('지옥 난이도 — 충성도 100 무장은 탈영하지 않는다', () => {
        const { store } = makeEngine(5);
        const faction = store.getFaction('fac_0')!;
        const nonLeader = faction.officers.find(id => id !== faction.leaderId)!;
        store.updateOfficer(nonLeader, { loyalty: 100 });
        const report = processHellConstraints(store, () => 0);
        expect(report.deserted.some(d => d.officerId === nonLeader)).toBe(false);
    });

    it('지옥 난이도 — 치안 0 도시가 random=0이면 반란으로 무주공산이 된다', () => {
        const { store } = makeEngine(5);
        const city = store.getAllCities().find(c => c.ownerId)!;
        const fromName = store.getFaction(city.ownerId!)!.name;
        const ds = city.developmentStats;
        store.updateCity(city.id, {
            developmentStats: { ...ds, publicOrder: 0 },
        });
        const report = processHellConstraints(store, () => 0);
        expect(report.revolted.some(r => r.cityId === city.id)).toBe(true);
        expect(store.getCity(city.id)!.ownerId).toBeNull();
        expect(report.revolted[0].fromFactionName).toBe(fromName);
    });

    it('지옥 난이도 — 치안 100 도시는 반란하지 않는다', () => {
        const { store } = makeEngine(5);
        const city = store.getAllCities().find(c => c.ownerId)!;
        const ds = city.developmentStats;
        store.updateCity(city.id, {
            developmentStats: { ...ds, publicOrder: 100 },
        });
        const report = processHellConstraints(store, () => 0);
        expect(report.revolted.some(r => r.cityId === city.id)).toBe(false);
    });
});
