import { describe, it, expect } from 'vitest';
import { GameStore } from '../src/core/game_store.js';
import { GameEngine } from '../src/core/game_engine.js';
import { buildWorld } from '../src/core/scenario_system.js';
import {
    processMonthlyFreeOfficerVisits,
    acceptVisit,
    declineVisit,
    BASE_VISIT_CHANCE,
} from '../src/core/free_officer_visit_system.js';
import { OfficerStatus } from '../src/core/types.js';
import scenarioIndex from '../src/data/scenarios/index.json';

describe('재야 무장 방문 시스템 [24][421-440]', () => {
    function setupWorld(playerFactionIndex: number) {
        const store = new GameStore();
        const engine = new GameEngine(store);
        const scenario = (scenarioIndex as any[]).find(s => s.id === '05')!;
        const world = buildWorld(scenario, playerFactionIndex);
        engine.initWorld(world.officers, world.factions, world.cities, []);
        store.setGlobalState({ playerFactionId: `fac_${playerFactionIndex}` });
        return { store, engine };
    }

    it('결정적 난수(0) 주입 시 신야 재야 무장이 방문 판정에 올라온다', () => {
        const { store } = setupWorld(0); // 조조 — 신야는 AI 세력 유비 소유
        const visits = processMonthlyFreeOfficerVisits(store, () => 0);
        // 황충·방통·위연 모두 100% 방문 확률로 타진
        const names = visits.map(v => v.officerName);
        expect(names).toContain('황충');
        expect(names).toContain('방통');
        expect(names).toContain('위연');
        for (const v of visits) {
            expect(v.cityName).toBe('신야');
            expect(v.factionName).toBe('유비');
        }
    });

    it('난수 0.999 주입 시 방문이 발생하지 않는다 (확률 상한 미달)', () => {
        const { store } = setupWorld(0);
        const visits = processMonthlyFreeOfficerVisits(store, () => 0.999);
        // 최대 방문 확률 = 0.3 × 1.0(야망) × 1.5(명성) = 0.45 < 0.999
        expect(visits).toHaveLength(0);
    });

    it('AI 세력은 자동 판정 — 난수 0이면 전원 수락으로 입사한다', () => {
        const { store } = setupWorld(0);
        const visits = processMonthlyFreeOfficerVisits(store, () => 0);
        for (const v of visits) {
            expect(v.needsPlayerChoice).toBe(false);
            expect(v.joined).toBe(true);
            const officer = store.getOfficer(v.officerId)!;
            expect(officer.factionId).toBe('fac_2'); // 신야 소유 세력
            expect(officer.status).toBe(OfficerStatus.OFFICER);
        }
    });

    it('AI 세력 자동 판정 — 수락 roll 실패 시 재야로 유지된다', () => {
        const { store } = setupWorld(0);
        // 첫 호출(방문 확률)은 0으로 통과, 두 번째 호출(수락 판정)은 0.99로 실패
        let call = 0;
        const visits = processMonthlyFreeOfficerVisits(store, () => (call++ % 2 === 0 ? 0 : 0.99));
        expect(visits.length).toBeGreaterThan(0);
        for (const v of visits) {
            expect(v.joined).toBe(false);
            const officer = store.getOfficer(v.officerId)!;
            expect(officer.status).toBe(OfficerStatus.FREE);
        }
    });

    it('플레이어 세력 도시 방문은 선택지 대기 상태로 반환된다', () => {
        const { store } = setupWorld(2); // 유비 — 신야가 플레이어 도시
        const visits = processMonthlyFreeOfficerVisits(store, () => 0);
        expect(visits.length).toBeGreaterThan(0);
        for (const v of visits) {
            expect(v.needsPlayerChoice).toBe(true);
            expect(v.joined).toBe(false);
            // 스토어에는 아직 반영되지 않음
            expect(store.getOfficer(v.officerId)!.status).toBe(OfficerStatus.FREE);
        }
    });

    it('acceptVisit — 맞이하면 입사 + 충성도 초기화(군주 명성 비례)', () => {
        const { store } = setupWorld(2);
        const visits = processMonthlyFreeOfficerVisits(store, () => 0);
        const visit = visits[0];
        acceptVisit(store, visit);

        const officer = store.getOfficer(visit.officerId)!;
        expect(officer.factionId).toBe('fac_2');
        expect(officer.status).toBe(OfficerStatus.OFFICER);
        expect(officer.loyalty).toBeGreaterThanOrEqual(60);
        expect(officer.loyalty).toBeLessThanOrEqual(100);
        // 세력/도시 목록 동기화
        expect(store.getFaction('fac_2')!.officers).toContain(visit.officerId);
        expect(store.getCity(visit.cityId)!.officerIds).toContain(visit.officerId);
    });

    it('declineVisit — 사절하면 재야 유지', () => {
        const { store } = setupWorld(2);
        const visits = processMonthlyFreeOfficerVisits(store, () => 0);
        const visit = visits[0];
        declineVisit(visit);
        expect(visit.joined).toBe(false);
        expect(store.getOfficer(visit.officerId)!.status).toBe(OfficerStatus.FREE);
    });

    it('방문 확률 상수는 명세 범위 내다', () => {
        expect(BASE_VISIT_CHANCE).toBe(0.3);
    });
});
