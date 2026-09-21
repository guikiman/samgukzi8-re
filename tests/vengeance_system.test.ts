import { describe, it, expect } from 'vitest';
import { GameStore } from '../src/core/game_store.js';
import { GameEngine } from '../src/core/game_engine.js';
import { buildWorld } from '../src/core/scenario_system.js';
import {
    areNemesis,
    judgeVengeance,
    executeVengeance,
    tryVengeanceOnEncounter,
    processMonthlyVengeance,
    VENGEANCE_CHANCE,
    VENGEANCE_SUCCESS_AFFINITY,
    VENGEANCE_FAIL_AFFINITY,
} from '../src/core/vengeance_system.js';
import scenarioIndex from '../src/data/scenarios/index.json';

describe('복수 이벤트 시스템 [32][33][C-인간관계]', () => {
    function setupWorld() {
        const store = new GameStore();
        const engine = new GameEngine(store);
        const scenario = (scenarioIndex as Array<{ id: string }>).find(s => s.id === '05')!;
        const world = buildWorld(scenario as never, 0);
        engine.initWorld(world.officers, world.factions, world.cities, []);
        store.setGlobalState({ playerFactionId: 'fac_0' });
        return { store, engine, world };
    }

    function makeNemesis(store: GameStore, aId: string, bId: string) {
        store.addRelationship({
            source: aId,
            target: bId,
            type: 'NEMESIS',
            affinity: -80,
            history: [],
        });
    }

    it('NEMESIS 엣지가 있으면 areNemesis가 true (역방향 사본 포함)', () => {
        const { store } = setupWorld();
        expect(areNemesis(store, 'cao_cao', 'liu_bei')).toBe(false);

        makeNemesis(store, 'cao_cao', 'liu_bei');
        expect(areNemesis(store, 'cao_cao', 'liu_bei')).toBe(true);
        // 역방향 조회도 true (addRelationship이 역 사본 생성)
        expect(areNemesis(store, 'liu_bei', 'cao_cao')).toBe(true);
        // 자기 자신과는 false
        expect(areNemesis(store, 'cao_cao', 'cao_cao')).toBe(false);
    });

    it('judgeVengeance — 확률 미만 roll에서만 발동하고, 무력 우위자가 단기접전 주도', () => {
        const { store } = setupWorld();
        // zhang_fei(무력 96+) vs zhuge_liang(지력 100) — 장비가 무력 우위
        makeNemesis(store, 'zhang_fei', 'zhuge_liang');

        const noRoll = judgeVengeance(store, 'zhang_fei', 'zhuge_liang', VENGEANCE_CHANCE + 0.01);
        expect(noRoll.triggered).toBe(false);

        const hit = judgeVengeance(store, 'zhang_fei', 'zhuge_liang', VENGEANCE_CHANCE - 0.01);
        expect(hit.triggered).toBe(true);
        // 무력 우위 쪽(장비)이 복수 주도, 무력>=지력이므로 단기접전
        expect(hit.actorId).toBe('zhang_fei');
        expect(hit.targetId).toBe('zhuge_liang');
        expect(hit.kind).toBe('DUEL');
    });

    it('judgeVengeance — 무력 우위자가 지력형이면 설전으로 복수', () => {
        const { store } = setupWorld();
        // 손권(might 70 < intelligence 82)이 제갈량(might 40)보다 무력 우위 → 주도권은 손권,
        // 주도자가 지력형이므로 설전
        makeNemesis(store, 'zhuge_liang', 'sun_quan');
        const hit = judgeVengeance(store, 'zhuge_liang', 'sun_quan', 0.01);
        expect(hit.triggered).toBe(true);
        expect(hit.actorId).toBe('sun_quan');
        expect(hit.kind).toBe('DEBATE');
    });

    it('executeVengeance DUEL — 자동 플레이로 판정 + 우호도 양방향 동기화', () => {
        const { store } = setupWorld();
        makeNemesis(store, 'zhang_fei', 'zhuge_liang');
        const before = store.getRelationships('zhang_fei').find(e => e.target === 'zhuge_liang')!.affinity;

        const outcome = executeVengeance(store, 'zhang_fei', 'zhuge_liang', 'DUEL');
        expect(outcome.triggered).toBe(true);
        expect(outcome.message).toBeTruthy();
        // 성패 무관하게 delta 적용
        const after = store.getRelationships('zhang_fei').find(e => e.target === 'zhuge_liang')!.affinity;
        const expected = outcome.success ? VENGEANCE_SUCCESS_AFFINITY : VENGEANCE_FAIL_AFFINITY;
        expect(after - before).toBe(expected);
        // 역방향 사본 동일
        const reverse = store.getRelationships('zhuge_liang').find(e => e.target === 'zhang_fei')!;
        expect(reverse.affinity).toBe(after);
        // 성공 시 사기 타격
        expect(outcome.targetMoraleHit).toBe(outcome.success ? 15 : 0);
    });

    it('executeVengeance DEBATE — 설전 판정 + VENGEANCE 이력 기록', () => {
        const { store } = setupWorld();
        makeNemesis(store, 'cao_cao', 'liu_bei');

        const outcome = executeVengeance(store, 'cao_cao', 'liu_bei', 'DEBATE');
        expect(outcome.triggered).toBe(true);
        expect(outcome.kind).toBe('DEBATE');
        const edge = store.getRelationships('cao_cao').find(e => e.target === 'liu_bei')!;
        const lastHistory = edge.history[edge.history.length - 1];
        expect(lastHistory.event).toBe('VENGEANCE');
        expect(lastHistory.delta).toBe(outcome.affinityDelta);
    });

    it('tryVengeanceOnEncounter — NEMESIS 아니면 발동하지 않는다', () => {
        const { store } = setupWorld();
        const outcome = tryVengeanceOnEncounter(store, 'cao_cao', 'liu_bei', 0.0);
        expect(outcome.triggered).toBe(false);
    });

    it('processMonthlyVengeance — 월간 처리에서 NEMESIS 쌍에 복수 이벤트가 발생한다', () => {
        const { store } = setupWorld();
        makeNemesis(store, 'zhang_fei', 'zhuge_liang');

        // Math.random을 낮은 값으로 고정 → 확률 통과 강제
        const realRandom = Math.random;
        Math.random = () => 0.01;
        let outcomes: ReturnType<typeof processMonthlyVengeance>;
        try {
            outcomes = processMonthlyVengeance(store);
        } finally {
            Math.random = realRandom;
        }
        expect(outcomes.length).toBe(1);
        expect(outcomes[0].message).toContain('복수');
        // 재실행 — 우호도가 이미 회복되어도 NEMESIS 타입은 유지되므로 다시 발동 가능 (월 1회 판정)
    });
});
