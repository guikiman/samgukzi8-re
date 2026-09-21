import { describe, it, expect } from 'vitest';
import { GameStore } from '../src/core/game_store.js';
import { GameEngine } from '../src/core/game_engine.js';
import { buildWorld } from '../src/core/scenario_system.js';
import { FactionFateSystem } from '../src/core/faction_fate_system.js';
import { OfficerStatus } from '../src/core/types.js';
import scenarioIndex from '../src/data/scenarios/index.json';

describe('세력 멸망 — 반복 판정 방지 [213]', () => {
    function setupWorld() {
        const store = new GameStore();
        const engine = new GameEngine(store);
        const scenario = (scenarioIndex as Array<{ id: string }>).find(s => s.id === '05')!;
        const world = buildWorld(scenario as never, 0); // 플레이어 = 조조 (fac_0)
        engine.initWorld(world.officers, world.factions, world.cities, []);
        store.setGlobalState({ playerFactionId: 'fac_0' });
        return { store, engine, world };
    }

    it('멸망 세력은 스토어에서 제거되어 반복 멸망 판정되지 않는다', () => {
        const { store, world } = setupWorld();
        const fate = new FactionFateSystem(store);

        // 손권 세력(fac_1)의 모든 도시를 무주화 → 멸망 조건
        const sunCities = world.cities.filter(c => c.ownerId === 'fac_1').map(c => c.id);
        expect(sunCities.length).toBeGreaterThan(0);
        for (const cityId of sunCities) {
            store.updateCity(cityId, { ownerId: null });
        }

        const report1 = fate.checkFates();
        expect(report1.destroyedFactionNames).toContain('손권');
        // 스토어에서 완전 제거 확인
        expect(store.getFaction('fac_1')).toBeNull();
        expect(store.getAllFactions().map(f => f.id)).not.toContain('fac_1');

        // 두 번째 판정 — 반복 멸망 없음
        const report2 = fate.checkFates();
        expect(report2.destroyedFactionNames).not.toContain('손권');
        expect(report2.destroyedFactionNames).toHaveLength(0);
    });

    it('멸망 세력의 무장은 재야화되어 등용 대상이 된다', () => {
        const { store, world } = setupWorld();
        const fate = new FactionFateSystem(store);
        const sunCities = world.cities.filter(c => c.ownerId === 'fac_1').map(c => c.id);
        const sunOfficers = store.getAllOfficers().filter(o => o.factionId === 'fac_1');
        expect(sunOfficers.length).toBeGreaterThan(0);

        for (const cityId of sunCities) {
            store.updateCity(cityId, { ownerId: null });
        }
        fate.checkFates();

        for (const o of sunOfficers) {
            const after = store.getOfficer(o.id)!;
            expect(after.status).toBe(OfficerStatus.FREE);
            expect(after.factionId).toBeNull();
            expect(after.loyalty).toBe(0);
        }
    });

    it('멸망 후 남은 도시는 무주공산이 된다', () => {
        const { store, world } = setupWorld();
        const fate = new FactionFateSystem(store);
        const sunCities = world.cities.filter(c => c.ownerId === 'fac_1').map(c => c.id);
        for (const cityId of sunCities) {
            store.updateCity(cityId, { ownerId: null });
        }
        fate.checkFates();

        // 무주화된 도시는 ownerId null 유지 (removeFaction이 재무주화하지 않음)
        for (const cityId of sunCities) {
            expect(store.getCity(cityId)!.ownerId).toBeNull();
        }
    });

    it('멸망 세력은 외교 AI 후보에서 제외된다', () => {
        const { store, world } = setupWorld();
        const fate = new FactionFateSystem(store);
        const sunCities = world.cities.filter(c => c.ownerId === 'fac_1').map(c => c.id);
        for (const cityId of sunCities) {
            store.updateCity(cityId, { ownerId: null });
        }
        fate.checkFates();

        // getAllFactions에 유령 세력이 남지 않음 — 외교 AI/패널 자동 정상화
        const factionIds = store.getAllFactions().map(f => f.id);
        expect(factionIds).not.toContain('fac_1');
        expect(factionIds).toContain('fac_0');
        expect(factionIds).toContain('fac_2');
    });
});
