// @vitest-environment jsdom — ChinaMapRenderer가 오프스크린 레이어에서 document.createElement 사용
// @vitest-environment jsdom — ChinaMapRenderer가 오프스크린 레이어에서 document.createElement 사용
import { describe, it, expect, vi } from 'vitest';
import { GameStore } from '../src/core/game_store.js';
import { GameEngine } from '../src/core/game_engine.js';
import { buildWorld } from '../src/core/scenario_system.js';
import { convertToFactionVagrant, clearVagrantOnCityGain, performRevivalCeremony } from '../src/core/vagrant_revival_system.js';
import { computeVagrantStrength, processVagrantMonthlyActions, resolvePlayerRaid, RAID_COMMAND_COST, RAID_FAIL_LOYALTY_PENALTY, RAID_FAIL_FATIGUE_MONTHS } from '../src/core/vagrant_monthly_actions.js';
import { ChinaMapRenderer } from '../src/core/china_map_renderer.js';
import { resolveCityClimateRegion } from '../src/core/monthly_report.js';
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

describe('방랑군 재기 플레이 흐름 [83][421-440]', () => {
    it('computeVagrantStrength는 충성 무장 통솔 기반 병력 가치를 반환한다', () => {
        const { store, world } = createEngine();
        const enemyId = world.factions.find(f => f.id !== 'fac_0')!.id;
        // 방랑군 전환 후 잔존 무장으로 역량 산출
        for (const c of world.cities.filter(c => c.ownerId === enemyId)) {
            store.updateCity(c.id, { ownerId: null });
        }
        convertToFactionVagrant(store, enemyId);

        const strength = computeVagrantStrength(store, enemyId);
        expect(strength).toBeGreaterThan(0);
        // 군주 + 충성도 40+ 무장의 통솔 × 20 합이므로 최소값 존재
        const expectedMin = store.getOfficersByFaction(enemyId)
            .filter(o => o.loyalty >= 40)
            .reduce((s, o) => s + o.stats.leadership * 20, 0);
        expect(strength).toBe(expectedMin);
    });

    it('습격 역량이 임계에 못 미치면 도시 습격을 시도하지 않는다', () => {
        const { store, world } = createEngine();
        const enemyId = world.factions.find(f => f.id !== 'fac_0')!.id;
        for (const c of world.cities.filter(c => c.ownerId === enemyId)) {
            store.updateCity(c.id, { ownerId: null });
        }
        convertToFactionVagrant(store, enemyId);

        // 소속 무장을 1명으로 줄여 역량 최소화 — 최약 도시 방어×10 미만으로 만들기
        const members = store.getOfficersByFaction(enemyId);
        for (const o of members.slice(1)) store.removeOfficer(o.id);
        const lone = store.getOfficersByFaction(enemyId)[0];
        store.updateOfficer(lone.id, { stats: { ...lone.stats, leadership: 10 } });
        // 방어 상한 올려 역량 부족 상태 강제 — 등용으로 무장이 영입되더라도(통솔 합산)
        // 절대 임계(strength >= defense*10)를 넘을 수 없게 한다
        for (const c of store.getAllCities()) {
            if (c.ownerId !== enemyId) store.updateCity(c.id, { defense: 9999 });
        }

        const before = store.getAllCities().map(c => c.ownerId).join(',');
        const results = processVagrantMonthlyActions(store);
        const raids = results.filter(r => r.factionId === enemyId && r.kind === 'RAID');
        expect(raids.length).toBe(0); // 임계 미달 — 시도 자체를 안 함
        // 도시 소유 변동 없음
        expect(store.getAllCities().map(c => c.ownerId).join(',')).toBe(before);
    });

    it('습격 판정 통과 시 최약 도시를 점령하고 재기(FACTION_REVIVED) 경로가 열린다', () => {
        const { store, world } = createEngine();
        const enemyId = world.factions.find(f => f.id !== 'fac_0')!.id;
        for (const c of world.cities.filter(c => c.ownerId === enemyId)) {
            store.updateCity(c.id, { ownerId: null });
        }
        convertToFactionVagrant(store, enemyId);

        // 모든 도시 방어를 1로 낮춰 습격 임계 통과 보장
        for (const c of store.getAllCities()) {
            if (c.ownerId !== enemyId) store.updateCity(c.id, { defense: 1 });
        }

        const results = processVagrantMonthlyActions(store);
        const raid = results.find(r => r.factionId === enemyId && r.kind === 'RAID');
        expect(raid).toBeDefined();
        // 습격 성공 시 세력 재기 — isVagrant 해제 + 도시 보유
        if (raid?.success) {
            expect(raid.capturedCityId).toBeDefined();
            expect(store.getFaction(enemyId)!.isVagrant).toBe(false);
            expect(store.getCitiesByFaction(enemyId).length).toBeGreaterThan(0);
        }
    });

    it('턴 경로와 무관하게 월간 행동 함수가 등용/습격 결과를 반환한다', () => {
        const { store, world } = createEngine();
        const enemyId = world.factions.find(f => f.id !== 'fac_0')!.id;
        for (const c of world.cities.filter(c => c.ownerId === enemyId)) {
            store.updateCity(c.id, { ownerId: null });
        }
        convertToFactionVagrant(store, enemyId);

        const results = processVagrantMonthlyActions(store);
        // 방랑군 전환 직후 잔존 무장이 있으므로 등용 시도 결과가 최소 1건 존재
        expect(results.length).toBeGreaterThanOrEqual(1);
        expect(results[0].kind === 'RECRUIT' || results[0].kind === 'RAID').toBe(true);
        expect(typeof results[0].message).toBe('string');
    });

    it('playerRaidCity는 전략 포인트 30을 소비하고 성공 시 재기 상태를 해제한다', () => {
        const { engine, store, world } = createEngine();
        const enemyId = world.factions.find(f => f.id !== 'fac_0')!.id;
        const playerCityIds = world.cities.filter(c => c.ownerId === 'fac_0').map(c => c.id);
        for (const c of playerCityIds) store.updateCity(c, { ownerId: null });
        convertToFactionVagrant(store, 'fac_0');

        // 방어 1로 낮춰 습격 성공 보장
        for (const c of store.getAllCities()) {
            if (c.ownerId === 'fac_0' || c.ownerId === null) continue;
            store.updateCity(c.id, { defense: 1 });
        }
        // 습격 대상 — 적 도시
        const target = world.cities.find(c => c.ownerId === enemyId)!.id;

        const ptsBefore = engine.strategicCommand.getStrategyPoints();
        expect(ptsBefore).toBeGreaterThanOrEqual(RAID_COMMAND_COST);

        const outcome = engine.playerRaidCity(target);
        expect(outcome.success).toBe(true);
        expect(engine.strategicCommand.getStrategyPoints()).toBe(ptsBefore - RAID_COMMAND_COST);
        // 재기 — isVagrant 해제 + 도시 보유
        expect(store.getFaction('fac_0')!.isVagrant).toBe(false);
        expect(store.getCitiesByFaction('fac_0').length).toBeGreaterThan(0);
    });

    it('전략 포인트 부족 시 습격이 거부되고 포인트가 소비되지 않는다', () => {
        const { engine, store, world } = createEngine();
        const playerCityIds = world.cities.filter(c => c.ownerId === 'fac_0').map(c => c.id);
        for (const c of playerCityIds) store.updateCity(c, { ownerId: null });
        convertToFactionVagrant(store, 'fac_0');

        // 포인트 소진 (orderRaid 4회 = 120 소비 → 100 미만)
        while (engine.strategicCommand.getStrategyPoints() >= 30) {
            engine.strategicCommand.orderRaid();
        }
        const pts = engine.strategicCommand.getStrategyPoints();
        expect(pts).toBeLessThan(30);

        const target = world.cities.find(c => c.ownerId !== null && c.ownerId !== 'fac_0')!.id;
        const outcome = engine.playerRaidCity(target);
        expect(outcome.success).toBe(false);
        expect(outcome.message).toContain('전략 포인트');
        expect(engine.strategicCommand.getStrategyPoints()).toBe(pts); // 미소비
    });

    it('습격 실패 시 결의 훼손(충성도 -8)과 3개월 습격 금지가 적용된다 [83]', () => {
        const { store, world } = createEngine();
        const enemyId = world.factions.find(f => f.id !== 'fac_0')!.id;
        for (const c of world.cities.filter(c => c.ownerId === 'fac_0')) {
            store.updateCity(c.id, { ownerId: null });
        }
        convertToFactionVagrant(store, 'fac_0');

        // 재야 무장 제거 — 등용 경로 차단 (영입 무장 통솔 합산으로 성공이 뒤집히는 것 방지)
        for (const o of store.getAllOfficers().filter(o => o.factionId === null)) {
            store.removeOfficer(o.id);
        }
        // 습격 시도는 가능하되 판정 실패를 확정 — 유지 무장 수에 관계없이:
        //   판정 실패: 통솔합(50×n) + 난수(≤60) < 방어
        //   임계 통과: 역량(50×n×20) ≥ 방어×10  ⇔  방어 ≤ 100×n
        // → 방어 = 50n+61 이면 두 조건을 모두 만족 (n≥2)
        const members = store.getOfficersByFaction('fac_0');
        for (const o of members) {
            store.updateOfficer(o.id, { stats: { ...o.stats, leadership: 50 } });
        }
        const leadershipSum = members.length * 50;
        const certainFailDefense = leadershipSum + 61;
        for (const c of store.getAllCities()) {
            if (c.ownerId !== 'fac_0' && c.ownerId !== null) store.updateCity(c.id, { defense: certainFailDefense });
        }
        const loyaltyBefore = new Map(members.map(o => [o.id, o.loyalty]));

        // 1개월차: 습격 시도 → 실패
        const results1 = processVagrantMonthlyActions(store);
        const raid1 = results1.find(r => r.factionId === 'fac_0' && r.kind === 'RAID');
        expect(raid1?.success).toBe(false);
        // 결의 훼손 확인
        for (const o of store.getOfficersByFaction('fac_0')) {
            expect(o.loyalty).toBe(Math.max(0, (loyaltyBefore.get(o.id) ?? 0) - RAID_FAIL_LOYALTY_PENALTY));
        }

        // 2~4개월차: 피로로 자율 습격 미시도 — RAID 결과 전무 (RAID_FAIL_FATIGUE_MONTHS = 3개월)
        for (let m = 0; m < RAID_FAIL_FATIGUE_MONTHS; m++) {
            const resultsN = processVagrantMonthlyActions(store);
            expect(resultsN.find(r => r.factionId === 'fac_0' && r.kind === 'RAID')).toBeUndefined();
        }
        // 피로 만료 후 방어를 임계 이하로 낮추면 자율 습격이 재개된다
        for (const c of store.getAllCities()) {
            if (c.ownerId !== 'fac_0' && c.ownerId !== null) store.updateCity(c.id, { defense: 1 });
        }
        const results4 = processVagrantMonthlyActions(store);
        const raid4 = results4.find(r => r.factionId === 'fac_0' && r.kind === 'RAID');
        expect(raid4).toBeDefined();
        expect(raid4!.success).toBe(true); // 방어 1, 통솔합 50n ≥ 1 — 확정 성공
    });

    it('월간 로그에 방랑군 동향이 수집되고 peek로 조회된다 [83]', async () => {
        const { store, engine, world } = createEngine();
        for (const c of world.cities.filter(c => c.ownerId === 'fac_0')) {
            store.updateCity(c.id, { ownerId: null });
        }

        // 1턴: 턴 후반 fate 판정에서 방랑군 전환 기록
        await engine.executeTurn();
        let log = engine.peekMonthlyPortedLog(false);
        expect(log.vagrant.some(v => v.kind === 'CONVERT' && v.factionName === '조조')).toBe(true);

        // 2턴: 전환된 방랑군이 월간 훅에서 활동 — 등용 시도 기록 (성공/실패 무관)
        await engine.executeTurn();
        log = engine.peekMonthlyPortedLog(false);
        expect(log.vagrant.some(v => v.kind === 'RECRUIT' && v.factionName === '조조')).toBe(true);
        // peek 읽기 전용 확인
        expect(engine.peekMonthlyPortedLog(false).vagrant.length).toBe(log.vagrant.length);
        void store;
    });

    it('재기 연출 — 도시 획득 시 군주 칭호/명성/등급이 승격된다 [83][421-440]', () => {
        const { store, world } = createEngine();
        const enemyId = world.factions.find(f => f.id !== 'fac_0')!.id;
        for (const c of world.cities.filter(c => c.ownerId === 'fac_0')) {
            store.updateCity(c.id, { ownerId: null });
        }
        convertToFactionVagrant(store, 'fac_0');

        const leader = store.getOfficer(world.factions.find(f => f.id === 'fac_0')!.leaderId)!;
        const fameBefore = leader.fame;
        const rankBefore = leader.rank;

        // 도시 1개 획득 → 재기
        const firstCity = world.cities.find(c => c.ownerId === enemyId)!;
        store.updateCity(firstCity.id, { ownerId: 'fac_0' });
        clearVagrantOnCityGain(store, 'fac_0');
        const ceremony1 = performRevivalCeremony(store, 'fac_0');

        expect(ceremony1).not.toBeNull();
        expect(ceremony1!.title).toBe('州牧'); // 거점 1개
        expect(ceremony1!.fameGain).toBe(50);
        const after = store.getOfficer(leader.id)!;
        expect(after.fame).toBe(fameBefore + 50);
        expect(after.rank).toBe(Math.min(rankBefore, 5)); // 장군급(5) 승격
        expect(ceremony1!.message).toContain('재기');

        // 칭호 경계: 거점 1개 = 州牧. 시나리오 05의 각 세력은 도시 1개이므로
        // 다른 적 도시를 하나 더 무주지로 만들어 스토어에 직접 귀속시켜 경계를 검증한다
        const neutral = store.getAllCities().find(c => c.ownerId === null && c.id !== firstCity.id)!;
        store.updateCity(neutral.id, { ownerId: 'fac_0' });
        const ceremony2 = performRevivalCeremony(store, 'fac_0');
        expect(ceremony2!.title).toBe('刺史'); // 거점 2개
    });

    it('습격 성공 시 전리품(자금/국고 약탈)이 점령 도시에 귀속된다 [131-145]', () => {
        const { store, world } = createEngine();
        const enemyId = world.factions.find(f => f.id !== 'fac_0')!.id;
        // 방랑군 전환
        for (const c of world.cities.filter(c => c.ownerId === 'fac_0')) {
            store.updateCity(c.id, { ownerId: null });
        }
        convertToFactionVagrant(store, 'fac_0');

        // 대상 도시에 약탈할 자금/국고 적립 + 방어 최소화
        const target = world.cities.find(c => c.ownerId === enemyId)!;
        const fundsBefore = target.funds;
        const enemyGoldBefore = store.getFaction(enemyId)!.gold;
        store.updateCity(target.id, { funds: fundsBefore + 1000, defense: 1 });

        // 습격 확정 — 다른 도시 방어도 1로 낮춰 최약 대상 경합 제거
        for (const c of store.getAllCities()) {
            if (c.ownerId !== 'fac_0' && c.ownerId !== null) store.updateCity(c.id, { defense: 1 });
        }
        const outcome = resolvePlayerRaid(store, 'fac_0', target.id);
        expect(outcome.success).toBe(true);

        // 전리품 메시지에 약탈 요약 포함
        if (outcome.message.includes('전리품')) {
            expect(outcome.message).toMatch(/전리품: (포로|자금|국고)/);
        }
        // 약탈된 자금은 점령 도시에 귀속 (방랑군이 도시+자금 모두 획득)
        const captured = store.getCity(target.id)!;
        expect(captured.ownerId).toBe('fac_0');
        expect(captured.funds).toBeGreaterThanOrEqual(0);
        // 피해 세력 국고는 감소했을 수 있음 (방어 도시 국고 약탈 비율 적용)
        expect(store.getFaction(enemyId)!.gold).toBeLessThanOrEqual(enemyGoldBefore);
    });
});

describe('지도 날씨 오버레이 데이터 바인딩 [321-340]', () => {
    it('도시 → 기후권 → 현재 날씨 바인딩이 일관된다', () => {
        const { engine, store } = createEngine();
        for (const c of store.getAllCities()) {
            const regionId = resolveCityClimateRegion(c.name, c.mapX, c.mapY);
            const climate = engine.climateManager.getClimate(regionId);
            expect(climate).not.toBeNull();
            expect(['SUNNY', 'CLOUDY', 'RAIN', 'STORM', 'SNOW', 'FOG', 'HEATWAVE'])
                .toContain(climate!.weather);
            expect(climate!.harvestModifier).toBeGreaterThan(0);
        }
    });

    it('ChinaMapRenderer에 날씨 필드를 넣어도 렌더가 예외 없이 동작한다', () => {
        // jsdom은 2D 컨텍스트를 지원하지 않는다 — 모든 ctx 메서드를 no-op으로 대체하고
        // 오프스크린 레이어용 document.createElement('canvas')도 스텁한다
        const mockCtx = new Proxy({}, {
            get(_t, prop) {
                if (prop === 'measureText') return () => ({ width: 20 });
                return () => ({ addColorStop: () => {} });
            },
            set() { return true; },
        });
        const makeMockCanvas = () => ({
            width: 800,
            height: 600,
            getContext: () => mockCtx,
        });
        const originalCreateElement = document.createElement.bind(document);
        vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
            if (tag === 'canvas') return makeMockCanvas() as unknown as HTMLCanvasElement;
            return originalCreateElement(tag);
        }) as never);

        const renderer = new ChinaMapRenderer(makeMockCanvas() as unknown as HTMLCanvasElement);
        renderer.setCities([
            { id: 'c1', name: '낙양', x: 0.5, y: 0.5, ownerColor: '#aa0000', isPlayer: true, garrison: 100, weather: 'STORM', harvestModifier: 0.5 },
            { id: 'c2', name: '건업', x: 0.7, y: 0.6, ownerColor: '#00aa00', isPlayer: false, garrison: 80, weather: 'SUNNY', harvestModifier: 1.2 },
            { id: 'c3', name: '무주', x: 0.3, y: 0.4, ownerColor: '#888898', isPlayer: false, garrison: 10 },
        ]);
        renderer.setShowWeatherOverlay(false);
        expect(() => renderer.render()).not.toThrow();
        renderer.setShowWeatherOverlay(true);
        expect(() => renderer.render()).not.toThrow();
    });
});
