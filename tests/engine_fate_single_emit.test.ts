import { describe, it, expect } from 'vitest';
import { GameStore } from '../src/core/game_store.js';
import { GameEngine } from '../src/core/game_engine.js';
import { buildWorld } from '../src/core/scenario_system.js';
import scenarioIndex from '../src/data/scenarios/index.json';

describe('엔진 턴 경로 — 멸망 이벤트 단일 발화 [213]', () => {
    function setupWorld() {
        const store = new GameStore();
        const engine = new GameEngine(store);
        const scenario = (scenarioIndex as Array<{ id: string }>).find(s => s.id === '05')!;
        const world = buildWorld(scenario as never, 0);
        engine.initWorld(world.officers, world.factions, world.cities, []);
        store.setGlobalState({ playerFactionId: 'fac_0' });
        return { store, engine };
    }

    it('executeTurn 3회 진행 시 손권 멸망 이벤트는 정확히 1회 발화된다', async () => {
        const { store, engine } = setupWorld();

        // 손권(fac_1) 도시 무주화 → 다음 턴에 멸망 판정
        const sunCities = store.getAllCities().filter(c => c.ownerId === 'fac_1').map(c => c.id);
        expect(sunCities.length).toBeGreaterThan(0);
        for (const id of sunCities) store.updateCity(id, { ownerId: null });

        const destroyedLog: string[] = [];
        engine.subscribe('FACTION_DESTROYED', (ev: { payload: { factionName: string } }) => {
            destroyedLog.push(ev.payload.factionName);
        });

        for (let t = 0; t < 3; t++) {
            await engine.executeTurn();
        }

        const sunCount = destroyedLog.filter(n => n === '손권').length;
        expect(sunCount).toBe(1);
        // 스토어에서 완전 제거 확인
        expect(store.getFaction('fac_1')).toBeNull();
    });
});
