import { describe, it, expect } from 'vitest';
import { GameStore } from '../src/core/game_store.js';
import { GameEngine } from '../src/core/game_engine.js';
import { buildWorld } from '../src/core/scenario_system.js';
import { FactionFateSystem } from '../src/core/faction_fate_system.js';
import { getVagrantFactionIds, clearVagrantOnCityGain } from '../src/core/vagrant_revival_system.js';
import { resolveCityClimateRegion } from '../src/core/monthly_report.js';
import { ClimateManager } from '../src/core/intelligence_narrative_climate.js';
import scenarioIndex from '../src/data/scenarios/index.json';

function createEngine() {
    const store = new GameStore();
    const engine = new GameEngine(store);
    const scenario = (scenarioIndex as Array<{ id: string }>).find(s => s.id === '05')!;
    const world = buildWorld(scenario as never, 0);
    engine.initWorld(world.officers, world.factions, world.cities, []);
    store.setGlobalState({ playerFactionId: 'fac_0' });
    return { store, engine, world };
}

describe('방랑군 재기 [83][213]', () => {
    it('무장이 남은 멸망 세력은 제거되지 않고 방랑군으로 전환된다', () => {
        const { store, world } = createEngine();
        const fate = new FactionFateSystem(store);
        const enemyFaction = world.factions.find(f => f.id !== 'fac_0')!;

        // 적 세력 도시 전체 무주화 → 멸망 판정 조건
        for (const c of world.cities.filter(c => c.ownerId === enemyFaction.id)) {
            store.updateCity(c.id, { ownerId: null });
        }

        const report = fate.checkFatesWithVagrantRevival(true);

        // 방랑군 전환 확인
        expect(report.vagrantConversions).toHaveLength(1);
        expect(report.vagrantConversions![0].factionId).toBe(enemyFaction.id);
        // 멸망 목록에서는 제외
        expect(report.destroyedFactionIds).not.toContain(enemyFaction.id);
        // 스토어에 세력 유지 — playerFactionId 정합성 보장
        expect(store.getFaction(enemyFaction.id)).not.toBeNull();
        expect(store.getFaction(enemyFaction.id)!.isVagrant).toBe(true);
        expect(getVagrantFactionIds(store)).toContain(enemyFaction.id);

        // 직속 무장 유지 확인 (군주 포함 상한 5)
        const kept = store.getOfficersByFaction(enemyFaction.id);
        expect(kept.length).toBeGreaterThan(0);
        expect(kept.length).toBeLessThanOrEqual(5);
        expect(kept.some(o => o.id === enemyFaction.leaderId)).toBe(true);
        // 결의 회복 (+30)
        for (const o of kept) {
            expect(o.loyalty).toBeGreaterThanOrEqual(30);
        }
    });

    it('무장이 없는 세력은 방랑군 전환 없이 완전 제거된다', () => {
        const { store, world } = createEngine();
        const fate = new FactionFateSystem(store);
        const enemyFaction = world.factions.find(f => f.id !== 'fac_0')!;

        // 도시 무주화 + 소속 무장 전원 사망 처리(제거)
        for (const c of world.cities.filter(c => c.ownerId === enemyFaction.id)) {
            store.updateCity(c.id, { ownerId: null });
        }
        for (const o of store.getOfficersByFaction(enemyFaction.id)) {
            store.removeOfficer(o.id);
        }

        const report = fate.checkFatesWithVagrantRevival(true);

        expect(report.vagrantConversions).toHaveLength(0);
        expect(report.destroyedFactionIds).toContain(enemyFaction.id);
        expect(store.getFaction(enemyFaction.id)).toBeNull();
    });

    it('reviveAsVagrant=false면 기존 동작(완전 제거)을 유지한다', () => {
        const { store, world } = createEngine();
        const fate = new FactionFateSystem(store);
        const enemyFaction = world.factions.find(f => f.id !== 'fac_0')!;

        for (const c of world.cities.filter(c => c.ownerId === enemyFaction.id)) {
            store.updateCity(c.id, { ownerId: null });
        }

        const report = fate.checkFates(); // 옵션 off 경로

        expect(report.vagrantConversions).toHaveLength(0);
        expect(report.destroyedFactionIds).toContain(enemyFaction.id);
        expect(store.getFaction(enemyFaction.id)).toBeNull();
    });

    it('방랑군 세력은 반복 판정에서 재전환되지 않고, 도시 획득 시 재기 상태가 해제된다', () => {
        const { store, world } = createEngine();
        const fate = new FactionFateSystem(store);
        const enemyFaction = world.factions.find(f => f.id !== 'fac_0')!;

        for (const c of world.cities.filter(c => c.ownerId === enemyFaction.id)) {
            store.updateCity(c.id, { ownerId: null });
        }
        fate.checkFatesWithVagrantRevival(true);
        expect(store.getFaction(enemyFaction.id)!.isVagrant).toBe(true);

        // 반복 판정 — 스팸 없음
        const report2 = fate.checkFatesWithVagrantRevival(true);
        expect(report2.vagrantConversions).toHaveLength(0);

        // 재기 — 도시 획득 시 isVagrant 해제
        const anyCity = world.cities[0].id;
        store.updateCity(anyCity, { ownerId: enemyFaction.id });
        clearVagrantOnCityGain(store, enemyFaction.id);
        expect(store.getFaction(enemyFaction.id)!.isVagrant).toBe(false);
    });

    it('턴 진행 중 플레이어 세력이 몰락하면 방랑군으로 생존하고 PLAYER_DEFEAT가 발화되지 않는다', async () => {
        const { store, engine, world } = createEngine();
        const defeats: unknown[] = [];
        const vagrants: unknown[] = [];
        engine.subscribe('PLAYER_DEFEAT', () => defeats.push(1));
        engine.subscribe('FACTION_VAGRANT', (e) => vagrants.push(e.payload));

        // 플레이어 세력(fac_0) 도시를 모두 타 세력에 귀속 → 멸망 직전
        const enemyId = world.factions.find(f => f.id !== 'fac_0')!.id;
        for (const c of world.cities.filter(c => c.ownerId === 'fac_0')) {
            store.updateCity(c.id, { ownerId: enemyId });
        }

        await engine.executeTurn();

        // 방랑군으로 생존 — playerFactionId 유효
        expect(store.getFaction('fac_0')).not.toBeNull();
        expect(store.getFaction('fac_0')!.isVagrant).toBe(true);
        expect(store.getGlobalState().playerFactionId).toBe('fac_0');
        expect(vagrants.length).toBe(1);
        expect(defeats.length).toBe(0);
    });
});

describe('도시별 기후·수확 보정 매핑 [321-340]', () => {
    it('도시명 키워드로 기후권이 결정된다', () => {
        expect(resolveCityClimateRegion('북평')).toBe('NORTHERN_FRONTIER');
        expect(resolveCityClimateRegion('건업')).toBe('SOUTHERN_JUNGLE');
        expect(resolveCityClimateRegion('하비')).toBe('RIVERLANDS');
        expect(resolveCityClimateRegion('낙양')).toBe('CENTRAL_PLAINS');
    });

    it('지도 좌표 기반 폴백이 동작한다', () => {
        expect(resolveCityClimateRegion('알수없는도시', 0.1, 0.1)).toBe('NORTHERN_FRONTIER');
        expect(resolveCityClimateRegion('알수없는도시', 0.5, 0.9)).toBe('SOUTHERN_JUNGLE');
        expect(resolveCityClimateRegion('알수없는도시', 0.9, 0.5)).toBe('RIVERLANDS');
        expect(resolveCityClimateRegion('알수없는도시', 0.5, 0.5)).toBe('CENTRAL_PLAINS');
    });

    it('갱신된 기후의 수확 보정은 weather 매핑과 일치한다', () => {
        const cm = new ClimateManager();
        // 초기 기본값은 지역별 특성값(예: 북방 SNOW, 온대 1.0)일 수 있으므로
        // updateClimate 계약 — 갱신 후 weather에서 도출된 보정과 일치 — 를 검증한다
        for (const weather of ['SUNNY', 'RAIN', 'STORM', 'SNOW'] as const) {
            const updated = cm.updateClimate('CENTRAL_PLAINS', weather);
            expect(updated?.harvestModifier).toBe(ClimateManager.weatherToHarvest(weather));
        }
        // 악천후일수록 보정 하락
        expect(ClimateManager.weatherToHarvest('STORM')).toBeLessThan(ClimateManager.weatherToHarvest('SUNNY'));
    });
});
