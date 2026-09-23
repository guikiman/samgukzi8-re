import { describe, it, expect } from 'vitest';
import { GameEngine } from '../src/core/game_engine.js';
import { GameStore } from '../src/core/game_store.js';
import { buildWorld } from '../src/core/scenario_system.js';
import scenarioIndex from '../src/data/scenarios/index.json';

function createEngine() {
    const store = new GameStore();
    const engine = new GameEngine(store);
    const scenario = (scenarioIndex as Array<{ id: string }>).find(s => s.id === '05')!;
    const world = buildWorld(scenario as never, 2);
    engine.initWorld(world.officers, world.factions, world.cities, []);
    return { store, engine, world };
}

describe('포팅 시스템 월간 훅 [76-85][321-340][341-360][421-438]', () => {
    it('[77] 출진 명령은 다음 턴 processTurn에서 완료 이벤트로 발화된다', async () => {
        const { store, engine, world } = createEngine();
        const playerFaction = world.factions.find(f => f.isPlayerControlled)!;
        const playerCity = world.cities.find(c => c.ownerId === playerFaction.id)!;
        const enemyCity = world.cities.find(c => c.ownerId && c.ownerId !== playerFaction.id)!;
        const leaderId = playerCity.officerIds[0];

        const ok = engine.strategicCommand.orderCampaign(
            { leaderId, officerIds: [leaderId], soldiers: 5000, training: 80, morale: 70, formation: 'basic' },
            enemyCity.id,
            store.getGlobalState().turnCount,
        );
        expect(ok).toBe(true);

        const completed: Array<{ targetCityId: unknown; leaderId: unknown }> = [];
        engine.subscribe('CAMPAIGN_ORDER_COMPLETED', (e) => {
            completed.push(e.payload as { targetCityId: unknown; leaderId: unknown });
        });

        await engine.executeTurn();

        expect(completed.length).toBe(1);
        expect(completed[0].targetCityId).toBe(enemyCity.id);
        expect(completed[0].leaderId).toBe(leaderId);
        expect(engine.strategicCommand.getActiveCampaigns().length).toBe(0);
    });

    it('[346] 첩보망은 월간 유지비(레벨 1)로 소모되며, 미유지 시 붕괴 이벤트가 발화된다', async () => {
        const { engine } = createEngine();
        engine.intelligenceManager.buildNetwork('F_TEST', 'C_TEST', 0);
        expect(engine.intelligenceManager.getNetwork('F_TEST', 'C_TEST')!.level).toBe(1);

        const collapsed: Array<{ factionId: unknown; cityId: unknown }> = [];
        engine.subscribe('INTELLIGENCE_NETWORK_COLLAPSED', (e) => {
            collapsed.push(e.payload as { factionId: unknown; cityId: unknown });
        });

        await engine.executeTurn();

        expect(collapsed.length).toBe(1);
        expect(collapsed[0].factionId).toBe('F_TEST');
        expect(engine.intelligenceManager.getNetwork('F_TEST', 'C_TEST')).toBeNull();
    });

    it('[321] 월간 기후 전이 후 전 지역이 갱신되고 세이브에 기후 스냅샷이 포함된다', async () => {
        const { engine } = createEngine();
        await engine.executeTurn();

        const climates = engine.climateManager.getAllClimates();
        expect(climates.length).toBeGreaterThanOrEqual(4);
        for (const c of climates) {
            expect(c.harvestModifier).toBeGreaterThan(0);
            expect(c.harvestModifier).toBeLessThanOrEqual(1.2);
        }
        expect(engine.save().ported!.climates.length).toBe(climates.length);
    });

    it('[434] 60세 도달 무장은 월간 훅에서 은퇴 처리된다', async () => {
        const { store, engine, world } = createEngine();
        const elder = world.officers[0];
        store.updateOfficer(elder.id, { birthYear: 1 }); // 현재 연도 기준 60세 초과로 조작

        const retired: Array<{ officerId: unknown }> = [];
        engine.subscribe('OFFICER_RETIRED', (e) => {
            retired.push(e.payload as { officerId: unknown });
        });

        await engine.executeTurn();

        expect(engine.lifeSimulator.isRetired(elder.id)).toBe(true);
        expect(retired.some(r => r.officerId === elder.id)).toBe(true);
    });

    it('첩보망/은퇴 상태는 세이브-로드 라운드트립에서 유지된다', async () => {
        const { engine } = createEngine();
        // 레벨 2로 구축 → 1턴 경과로 레벨 1 남음
        engine.intelligenceManager.buildNetwork('F_ROUNDTRIP', 'C_ROUNDTRIP', 0);
        engine.intelligenceManager.buildNetwork('F_ROUNDTRIP', 'C_ROUNDTRIP', 0);
        await engine.executeTurn();
        expect(engine.intelligenceManager.getNetwork('F_ROUNDTRIP', 'C_ROUNDTRIP')!.level).toBe(1);

        const save = engine.save();
        const engine2 = new GameEngine(new GameStore());
        engine2.load(save);

        expect(engine2.intelligenceManager.getNetwork('F_ROUNDTRIP', 'C_ROUNDTRIP')!.level).toBe(1);
        // 은퇴 기록도 복원 확인 (세이브 시점까지의 은퇴자 전수 복원)
        for (const r of save.ported!.retiredOfficers ?? []) {
            expect(engine2.lifeSimulator.isRetired(r.officerId)).toBe(true);
        }
    });
});

describe('월간 보고서 포팅 동향 peek [76-85][321-340][341-360][421-438]', () => {
    it('peekMonthlyPortedLog는 출진 완료를 기록하고 consume 시 버퍼를 비운다', async () => {
        const { store, engine, world } = createEngine();
        const playerFaction = world.factions.find(f => f.isPlayerControlled)!;
        const playerCity = world.cities.find(c => c.ownerId === playerFaction.id)!;
        const enemyCity = world.cities.find(c => c.ownerId && c.ownerId !== playerFaction.id)!;
        const leaderId = playerCity.officerIds[0];

        engine.strategicCommand.orderCampaign(
            { leaderId, officerIds: [leaderId], soldiers: 3000, training: 70, morale: 60, formation: 'basic' },
            enemyCity.id,
            store.getGlobalState().turnCount,
        );
        await engine.executeTurn();

        // peek (읽기 전용) — 출진 기록 확인
        const peeked = engine.peekMonthlyPortedLog(false);
        expect(peeked.campaigns).toHaveLength(1);
        expect(peeked.campaigns[0].targetCity).toBe(enemyCity.id);
        expect(peeked.campaigns[0].soldiers).toBe(3000);

        // 다시 peek해도 유지 (읽기 전용)
        expect(engine.peekMonthlyPortedLog(false).campaigns).toHaveLength(1);

        // consume — 읽고 비움
        const consumed = engine.peekMonthlyPortedLog(true);
        expect(consumed.campaigns).toHaveLength(1);
        expect(engine.peekMonthlyPortedLog(false).campaigns).toHaveLength(0);
    });

    it('출진이 없는 달의 peek는 빈 버퍼를 반환한다', async () => {
        const { engine } = createEngine();
        await engine.executeTurn();
        const log = engine.peekMonthlyPortedLog(false);
        expect(log.campaigns).toHaveLength(0);
        expect(log.transports).toHaveLength(0);
        expect(log.collapsedNetworks).toHaveLength(0);
        expect(log.retired).toHaveLength(0);
    });
});

describe('playerFactionId 정합성 [213]', () => {
    it('플레이어 세력이 완전히 소멸(무장 0)하면 PLAYER_DEFEAT 이벤트가 발화된다', async () => {
        const { store, engine, world } = createEngine();
        const playerFaction = world.factions.find(f => f.isPlayerControlled)!;
        store.setGlobalState({ playerFactionId: playerFaction.id });

        const defeats: Array<{ message: unknown }> = [];
        engine.subscribe('PLAYER_DEFEAT', (e) => {
            defeats.push(e.payload as { message: unknown });
        });

        // [83] 재기 불가 조건 — 도시 상실 + 소속 무장 전원 제거 → 완전 멸망 경로
        for (const c of world.cities.filter(c => c.ownerId === playerFaction.id)) {
            store.updateCity(c.id, { ownerId: null });
        }
        for (const o of store.getOfficersByFaction(playerFaction.id)) {
            store.removeOfficer(o.id);
        }
        await engine.executeTurn();

        expect(defeats.length).toBe(1);
        expect(typeof defeats[0].message).toBe('string');
        expect(defeats[0].message).toContain('멸망');
        // 스토어에서 세력 제거 확인
        expect(store.getFaction(playerFaction.id)).toBeNull();
    });

    it('플레이어 세력이 생존하면 PLAYER_DEFEAT는 발화되지 않는다', async () => {
        const { store, engine, world } = createEngine();
        const playerFaction = world.factions.find(f => f.isPlayerControlled)!;
        store.setGlobalState({ playerFactionId: playerFaction.id });

        let defeatCount = 0;
        engine.subscribe('PLAYER_DEFEAT', () => { defeatCount++; });

        await engine.executeTurn();
        expect(defeatCount).toBe(0);
        expect(store.getFaction(playerFaction.id)).not.toBeNull();
    });
});
