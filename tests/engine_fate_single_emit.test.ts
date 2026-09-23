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

    it('executeTurn 3회 진행 중 손권은 완전 멸망(스토어 제거)되지 않는다 [83][213]', async () => {
        const { store, engine } = setupWorld();

        // 손권(fac_1) 도시 무주화 → 다음 턴에 멸망 판정
        // [83] 엔진은 방랑군 재기 옵션 on — 무장이 남은 손권은 제거 대신 방랑군 전환.
        // 방랑군이 습격으로 재기했다가 도시를 재상실해 재전환되는 것도 정상 흐름이다.
        const sunCities = store.getAllCities().filter(c => c.ownerId === 'fac_1').map(c => c.id);
        expect(sunCities.length).toBeGreaterThan(0);
        for (const id of sunCities) store.updateCity(id, { ownerId: null });

        const destroyedLog: string[] = [];
        let vagrantEvents = 0;
        engine.subscribe('FACTION_DESTROYED', (ev: { payload: { factionName: string } }) => {
            destroyedLog.push(ev.payload.factionName);
        });
        engine.subscribe('FACTION_VAGRANT', () => { vagrantEvents++; });

        for (let t = 0; t < 3; t++) {
            await engine.executeTurn();
            // 매 턴 종료 시점 불변식: 손권 세력이 스토어에 존재 — playerFactionId 항상 유효
            expect(store.getFaction('fac_1')).not.toBeNull();
        }

        // 멸망 이벤트는 발화되지 않음 (방랑군으로 생존)
        expect(destroyedLog.filter(n => n === '손권').length).toBe(0);
        // 방랑군 전환은 최소 1회 발생
        expect(vagrantEvents).toBeGreaterThanOrEqual(1);
    });
});
