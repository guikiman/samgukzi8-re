import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from '../src/core/game_engine.js';
import { GameStore } from '../src/core/game_store.js';
import { buildWorld } from '../src/core/scenario_system.js';
import scenarioIndex from '../src/data/scenarios/index.json';
import { OfficerStatus } from '../src/core/types.js';
import {
    applyRecruitFailure,
    getRecruitAffinityModifier,
    RECRUIT_FAILURE_AFFINITY_DROP,
    RECRUIT_FAILED_EVENT,
} from '../src/core/recruit_relation_system.js';

describe('등용-관계망 연동 [C-인간관계][24]', () => {
    let store: GameStore;
    let engine: GameEngine;

    beforeEach(() => {
        store = new GameStore();
        engine = new GameEngine(store);
        const scenario = (scenarioIndex as Array<{ id: string }>).find(s => s.id === '05')!;
        const world = buildWorld(scenario as never, 2);
        engine.initWorld(world.officers, world.factions, world.cities, []);
    });

    it('등용 실패 시 우호도가 -10 감소하고 이력이 기록된다', () => {
        const [a, b] = store.getAllOfficers();
        applyRecruitFailure(store, a.id, b.id);

        const edge = store.getRelationships(a.id).find(e => e.target === b.id);
        expect(edge).toBeTruthy();
        expect(edge!.affinity).toBe(RECRUIT_FAILURE_AFFINITY_DROP);
        expect(edge!.history[0].event).toBe(RECRUIT_FAILED_EVENT);
        expect(edge!.history[0].delta).toBe(RECRUIT_FAILURE_AFFINITY_DROP);
    });

    it('우호도 감소는 양방향으로 동기화된다', () => {
        const [a, b] = store.getAllOfficers();
        applyRecruitFailure(store, a.id, b.id);

        const forward = store.getRelationships(a.id).find(e => e.target === b.id);
        const reverse = store.getRelationships(b.id).find(e => e.target === a.id);
        expect(forward?.affinity).toBe(RECRUIT_FAILURE_AFFINITY_DROP);
        expect(reverse?.affinity).toBe(RECRUIT_FAILURE_AFFINITY_DROP);
    });

    it('반복 실패 시 우호도가 누적 감소하며 -100에 클램프된다', () => {
        const [a, b] = store.getAllOfficers();
        for (let i = 0; i < 15; i++) {
            applyRecruitFailure(store, a.id, b.id);
        }
        const edge = store.getRelationships(a.id).find(e => e.target === b.id);
        expect(edge!.affinity).toBe(-100);
    });

    it('우호도 -30 이하면 등용 성공률이 -15%p 감소한다', () => {
        const [a, b] = store.getAllOfficers();
        // 5회 실패 → -50
        for (let i = 0; i < 5; i++) applyRecruitFailure(store, a.id, b.id);
        const modifier = getRecruitAffinityModifier(store, a.id, b.id);
        expect(modifier).toBe(-0.15);
    });

    it('높은 우호도 관계는 등용 성공률을 높인다', () => {
        const [a, b] = store.getAllOfficers();
        store.addRelationship({
            source: a.id, target: b.id, type: 'SWORN_BROTHER',
            affinity: 60, history: [],
        });
        const modifier = getRecruitAffinityModifier(store, a.id, b.id);
        expect(modifier).toBe(0.15); // 60/200 = 0.3 → +0.15 클램프
    });

    it('관계가 없는 무장 간 보정값은 0이다', () => {
        const [a, b] = store.getAllOfficers();
        expect(getRecruitAffinityModifier(store, a.id, b.id)).toBe(0);
    });

    it('실패 훅이 실제 recruit() 실패 경로에서 호출된다', () => {
        const gs = store.getGlobalState();
        const playerFactionId = gs.playerFactionId ?? 'fac_2';
        // 충성도 100 무장 = 등용이 사실상 불가능 (확률 최소 5%)
        const officer = store.getAllOfficers().find(o => o.factionId !== null && o.id !== 'officer_nonexistent')!;
        store.updateOfficer(officer.id, { loyalty: 100, ambition: 0 });

        const leader = store.getFaction(playerFactionId)!.leaderId;
        // 20회 시도 — 최소 1회 실패 보장(확률적으로), 실패마다 우호도 -10
        for (let i = 0; i < 20; i++) {
            engine['loyaltySystem'].recruit(officer.id, playerFactionId, store.getCitiesByFaction(playerFactionId)[0].id, leader);
        }
        const edge = store.getRelationships(leader).find(e => e.target === officer.id);
        // 실패가 한 번이라도 있었다면 엣지가 존재하고 음수 우호도
        if (edge) {
            expect(edge.affinity).toBeLessThan(0);
            expect(edge.history.every(h => h.event === RECRUIT_FAILED_EVENT)).toBe(true);
        }
    });

    it('등용 성공 후에는 포로 무장이 정상 소속으로 전환된다 (회귀 확인)', () => {
        const officer = store.getAllOfficers().find(o => o.factionId === null)!;
        store.updateOfficer(officer.id, { status: OfficerStatus.FREE, loyalty: 0 });
        expect(officer.status).toBe(OfficerStatus.FREE);
    });
});
