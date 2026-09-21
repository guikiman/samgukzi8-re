import { describe, it, expect } from 'vitest';
import { GameStore } from '../src/core/game_store.js';
import { GameEngine } from '../src/core/game_engine.js';
import { buildWorld } from '../src/core/scenario_system.js';
import { OfficerStatus } from '../src/core/types.js';
import { processBattleSpoils } from '../src/core/battle_spoils_system.js';
import {
    isCaptive,
    imprisonCaptive,
    judgeEscape,
    processMonthlyCaptiveEvents,
    releaseCaptivesInCity,
    getCaptivesInCity,
    BASE_ESCAPE_CHANCE,
} from '../src/core/captive_escape_system.js';
import scenarioIndex from '../src/data/scenarios/index.json';

describe('포로 수용/탈출/석방 시스템 [131-145]', () => {
    function setupWorld() {
        const store = new GameStore();
        const engine = new GameEngine(store);
        const scenario = (scenarioIndex as Array<{ id: string }>).find(s => s.id === '05')!;
        const world = buildWorld(scenario as never, 0); // 플레이어 = 조조 (fac_0)
        engine.initWorld(world.officers, world.factions, world.cities, []);
        store.setGlobalState({ playerFactionId: 'fac_0' });
        return { store, engine, world };
    }

    it('judgeEscape — 지력이 높을수록 탈출 확률이 높다', () => {
        // 지력 0 → 15% / 지력 30 → 15% + 4.5% = 19.5% / 지력 100 → 15% + 15% = 30%
        expect(judgeEscape(0, BASE_ESCAPE_CHANCE - 0.001)).toBe(true);
        expect(judgeEscape(0, BASE_ESCAPE_CHANCE + 0.001)).toBe(false);
        expect(judgeEscape(30, 0.10)).toBe(true);
        expect(judgeEscape(30, 0.25)).toBe(false);
        expect(judgeEscape(100, 0.29)).toBe(true);
        expect(judgeEscape(100, 0.31)).toBe(false);
    });

    it('judgeEscape — 지능이 비정상적으로 높으면 50% 상한 클램프가 적용된다', () => {
        // 지력 200 이상 → 확률 클램프 50%
        expect(judgeEscape(500, 0.49)).toBe(true);
        expect(judgeEscape(500, 0.51)).toBe(false);
    });

    /** 확정적 포획 셋업 — target만 포획, 나머지는 roll 0.99로 도주 확정 */
    function captureOnly(store: GameStore, targetId: string) {
        const defenders = store.getOfficersByCity('city_건업')
            .filter(o => o.status !== OfficerStatus.FREE && o.stats.intelligence < 100);
        expect(defenders.length).toBeGreaterThan(0);
        expect(defenders.some(o => o.id === targetId)).toBe(true);
        const rolls = defenders.map(o => ({ officerId: o.id, roll: o.id === targetId ? 0 : 0.99 }));
        return processBattleSpoils(store, 'city_허창', 'city_건업', rolls);
    }

    it('포획된 무장은 공격자 도시에 수용되고 isCaptive로 판별된다 (유령 포로 결함 수복)', () => {
        const { store } = setupWorld();
        // 건업(손권) 공략 — 지력 100 아닌 수비 무장 1명만 확정 포획
        const target = store.getOfficersByCity('city_건업')
            .filter(o => o.status !== OfficerStatus.FREE && o.stats.intelligence < 100)[0];

        const result = captureOnly(store, target.id);
        expect(result.capturedOfficerIds).toEqual([target.id]);

        const captive = store.getOfficer(target.id)!;
        // 재야화 + 충성도 0 + 공격자 도시 수용
        expect(captive.status).toBe(OfficerStatus.FREE);
        expect(captive.factionId).toBeNull();
        expect(captive.loyalty).toBe(0);
        expect(captive.cityId).toBe('city_허창');
        // 공격자 도시 officerIds에 포함 (패널에 보임)
        expect(store.getCity('city_허창')!.officerIds).toContain(target.id);
        expect(store.getCity('city_건업')!.officerIds).not.toContain(target.id);
        // isCaptive 판별 + 수용 도시 포로 목록 조회
        expect(isCaptive(store, target.id)).toBe(true);
        expect(getCaptivesInCity(store, 'city_허창').map(c => c.id)).toContain(target.id);
        expect(getCaptivesInCity(store, 'city_건업')).toHaveLength(0);
    });

    it('월간 탈출 판정 — 탈출 성공 시 무장이 도시에서 자유화된다', () => {
        const { store } = setupWorld();
        const target = store.getOfficersByCity('city_건업')
            .filter(o => o.status !== OfficerStatus.FREE && o.stats.intelligence < 100)[0];
        captureOnly(store, target.id);
        expect(isCaptive(store, target.id)).toBe(true);

        // Math.random 스텁 — 항상 탈출 성공
        const realRandom = Math.random;
        Math.random = () => 0.01;
        let report: ReturnType<typeof processMonthlyCaptiveEvents>;
        try {
            report = processMonthlyCaptiveEvents(store);
        } finally {
            Math.random = realRandom;
        }

        expect(report.escaped.map(e => e.officerId)).toContain(target.id);
        expect(report.messages.some(m => m.includes('탈출'))).toBe(true);
        // 탈출 후: 마커가 ESCAPED로 바뀌어 isCaptive가 false — 재야 무소속 (등용 대상)
        expect(isCaptive(store, target.id)).toBe(false);
        const o = store.getOfficer(target.id)!;
        expect(o.cityId).toBeNull();
        expect(o.status).toBe(OfficerStatus.FREE);
    });

    it('월간 탈출 판정 — 탈출 실패 시 포로 상태 유지', () => {
        const { store } = setupWorld();
        const target = store.getOfficersByCity('city_건업')
            .filter(o => o.status !== OfficerStatus.FREE && o.stats.intelligence < 100)[0];
        captureOnly(store, target.id);

        const realRandom = Math.random;
        Math.random = () => 0.99; // 항상 탈출 실패
        try {
            const report = processMonthlyCaptiveEvents(store);
            expect(report.escaped).toHaveLength(0);
        } finally {
            Math.random = realRandom;
        }
        expect(isCaptive(store, target.id)).toBe(true);
        expect(getCaptivesInCity(store, 'city_허창')).toHaveLength(1);
    });

    it('구출: 수용 도시 함락 시 그 도시의 포로가 모두 석방된다', () => {
        const { store } = setupWorld();
        const target = store.getOfficersByCity('city_건업')
            .filter(o => o.status !== OfficerStatus.FREE && o.stats.intelligence < 100)[0];
        captureOnly(store, target.id);
        expect(getCaptivesInCity(store, 'city_허창')).toHaveLength(1);

        // 수용 도시(허창)가 함락됐다고 가정 — 소유권 변경 직후 호출
        const released = releaseCaptivesInCity(store, 'city_허창');
        expect(released.map(r => r.officerId)).toContain(target.id);
        // 석방 후 재야로 그 도시에 남는다 (새 소유자가 등용 가능)
        const o = store.getOfficer(target.id)!;
        expect(o.status).toBe(OfficerStatus.FREE);
        expect(o.cityId).toBe('city_허창');
        expect(isCaptive(store, target.id)).toBe(false);
        expect(getCaptivesInCity(store, 'city_허창')).toHaveLength(0);
    });

    it('재야 무장은 포로로 오인되지 않는다', () => {
        const { store } = setupWorld();
        // 시나리오의 재야 무장 (FREE 상태)
        const freeOfficers = store.getAllOfficers().filter(o => o.status === OfficerStatus.FREE);
        for (const o of freeOfficers.slice(0, 3)) {
            expect(isCaptive(store, o.id)).toBe(false);
        }
    });

    it('imprisonCaptive는 자기-엣지가 없는 무장도 안전하게 수용한다', () => {
        const { store } = setupWorld();
        const before = store.getAllOfficers().length;
        // 가상 무장 추가 — 관계 엣지 없음
        store.addOfficer({
            id: 'free_test', name: '무엣지인', factionId: null, cityId: null,
            status: OfficerStatus.FREE, rank: 0, loyalty: 0, ambition: 50,
            stats: { leadership: 60, might: 60, intelligence: 60, politics: 60, charisma: 60 },
            history: [],
        } as never);
        expect(store.getAllOfficers().length).toBe(before + 1);
        expect(isCaptive(store, 'free_test')).toBe(false);
        imprisonCaptive(store, 'free_test', 'city_허창');
        expect(isCaptive(store, 'free_test')).toBe(true);
        expect(store.getOfficer('free_test')!.cityId).toBe('city_허창');
    });
});
