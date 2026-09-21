import { describe, it, expect } from 'vitest';
import { GameStore } from '../src/core/game_store.js';
import { GameEngine } from '../src/core/game_engine.js';
import { buildWorld } from '../src/core/scenario_system.js';
import { processBattleSpoils, judgeCapture, BASE_CAPTURE_CHANCE } from '../src/core/battle_spoils_system.js';
import { OfficerStatus } from '../src/core/types.js';
import scenarioIndex from '../src/data/scenarios/index.json';

describe('전투 후처리 — 포로·약탈 [131-145]', () => {
    function setupWorld() {
        const store = new GameStore();
        const engine = new GameEngine(store);
        const scenario = (scenarioIndex as Array<{ id: string }>).find(s => s.id === '05')!;
        const world = buildWorld(scenario as never, 0); // 플레이어 = 조조 (fac_0)
        engine.initWorld(world.officers, world.factions, world.cities, []);
        store.setGlobalState({ playerFactionId: 'fac_0' });
        return { store, engine, world };
    }

    it('포획 판정: roll이 포획률 미만이면 포획 성공', () => {
        const { world } = setupWorld();
        const lowInt = world.officers.find(o => o.id === 'zhang_fei')!; // 지력 45
        expect(judgeCapture(lowInt, 0.1)).toBe(true);
        expect(judgeCapture(lowInt, 0.9)).toBe(false);
    });

    it('지력이 높은 무장은 포획되기 어렵다', () => {
        const { world } = setupWorld();
        const highInt = world.officers.find(o => o.id === 'zhuge_liang')!; // 지력 100
        // 지력 100 → 포획률 0.35 - 0.25 = 0.10
        expect(judgeCapture(highInt, 0.05)).toBe(true);
        expect(judgeCapture(highInt, 0.15)).toBe(false);
    });

    it('승리 후 수비 무장 일부가 포획되어 재야가 된다', () => {
        const { store } = setupWorld();
        // 건업(손권) 공략 가정 — 수비 무장 중 1명 강제 포획 (roll 0으로 확정)
        const defenders = store.getOfficersByCity('city_건업').filter(o => o.status !== OfficerStatus.FREE);
        expect(defenders.length).toBeGreaterThan(0);
        const rolls = defenders.map(o => ({ officerId: o.id, roll: o.stats.intelligence >= 100 ? 0.05 : 0 }));

        const result = processBattleSpoils(store, 'city_허창', 'city_건업', rolls);
        expect(result.capturedOfficerIds.length).toBeGreaterThan(0);
        for (const id of result.capturedOfficerIds) {
            const captured = store.getOfficer(id)!;
            expect(captured.status).toBe(OfficerStatus.FREE);
            expect(captured.factionId).toBeNull();
            expect(captured.loyalty).toBe(0);
        }
        // 포획된 무장은 건업 주둔 목록에서 제거됨
        const remaining = store.getOfficersByCity('city_건업').map(o => o.id);
        for (const id of result.capturedOfficerIds) {
            expect(remaining).not.toContain(id);
        }
    });

    it('병력 약탈: 수비 도시 병력 25%가 공격 도시로 이동한다', () => {
        const { store } = setupWorld();
        const before = {
            defender: store.getCity('city_건업')!.development,
            attacker: store.getCity('city_허창')!.development,
        };
        const result = processBattleSpoils(store, 'city_허창', 'city_건업', []);
        expect(result.troopsPlundered).toBe(Math.floor(before.defender * 0.25));
        expect(store.getCity('city_건업')!.development).toBe(before.defender - result.troopsPlundered);
        expect(store.getCity('city_허창')!.development).toBe(before.attacker + result.troopsPlundered);
    });

    it('자금 약탈: 도시 자금 40% + 세력 국고 20%가 이동한다', () => {
        const { store } = setupWorld();
        const cityBefore = store.getCity('city_건업')!.funds;
        const facBefore = store.getFaction('fac_1')!.gold;
        const attackerFacBefore = store.getFaction('fac_0')!.gold;

        const result = processBattleSpoils(store, 'city_허창', 'city_건업', []);
        expect(result.fundsPlundered).toBe(Math.floor(cityBefore * 0.4));
        expect(result.factionGoldPlundered).toBe(Math.floor(facBefore * 0.2));
        expect(store.getFaction('fac_0')!.gold).toBe(attackerFacBefore + result.factionGoldPlundered);
    });

    it('재야 무장은 포로 대상에서 제외된다', () => {
        const { store } = setupWorld();
        // 신야의 재야 무장(황충 등)이 있는 도시를 대상으로 테스트
        const freeOfficers = store.getOfficersByCity('city_신야').filter(o => o.status === OfficerStatus.FREE);
        if (freeOfficers.length === 0) return; // 시나리오에 재야가 없으면 스킵
        processBattleSpoils(store, 'city_허창', 'city_신야', freeOfficers.map(o => ({ officerId: o.id, roll: 0 })));
        for (const o of freeOfficers) {
            expect(store.getOfficer(o.id)!.status).toBe(OfficerStatus.FREE); // 그대로 재야
        }
    });

    it('존재하지 않는 도시면 빈 결과를 반환한다 (안전 처리)', () => {
        const { store } = setupWorld();
        const result = processBattleSpoils(store, 'city_허창', 'city_존재않음');
        expect(result.capturedOfficerIds).toEqual([]);
        expect(result.troopsPlundered).toBe(0);
        expect(result.messages).toEqual([]);
    });
});
