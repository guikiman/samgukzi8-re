import { describe, it, expect } from 'vitest';
import { GameStore } from '../src/core/game_store.js';
import { GameEngine } from '../src/core/game_engine.js';
import { buildWorld } from '../src/core/scenario_system.js';
import { OfficerStatus } from '../src/core/types.js';
import { processBattleSpoils } from '../src/core/battle_spoils_system.js';
import { isCaptive, getCapturedOriginFaction } from '../src/core/captive_escape_system.js';
import {
    areSwornBrothers,
    findRescuers,
    judgeRescue,
    processMonthlySwornBrotherRescues,
    BASE_RESCUE_CHANCE,
    RESCUE_AFFINITY_BONUS,
} from '../src/core/sworn_brother_rescue_system.js';
import { processCaptives } from '../src/core/ai_captive_system.js';
import scenarioIndex from '../src/data/scenarios/index.json';

describe('의형제 구원 + 명성 연동 [C-인간관계][11]', () => {
    function setupWorld() {
        const store = new GameStore();
        const engine = new GameEngine(store);
        const scenario = (scenarioIndex as Array<{ id: string }>).find(s => s.id === '05')!;
        const world = buildWorld(scenario as never, 0);
        engine.initWorld(world.officers, world.factions, world.cities, []);
        store.setGlobalState({ playerFactionId: 'fac_0' });
        return { store, engine, world };
    }

    function captureOnly(store: GameStore, targetId: string) {
        const defenders = store.getOfficersByCity('city_건업')
            .filter(o => o.status !== OfficerStatus.FREE && o.stats.intelligence < 100);
        const rolls = defenders.map(o => ({ officerId: o.id, roll: o.id === targetId ? 0 : 0.99 }));
        return processBattleSpoils(store, 'city_허창', 'city_건업', rolls);
    }

    it('의형제 관계 판별 + 구출자 탐색', () => {
        const { store } = setupWorld();
        expect(areSwornBrothers(store, 'guan_yu', 'zhang_fei')).toBe(false);

        // 관우↔장비 의형제 (양방향 인덱스 동시 생성)
        store.addRelationship({ source: 'guan_yu', target: 'zhang_fei', type: 'SWORN_BROTHER', affinity: 50, history: [] });
        expect(areSwornBrothers(store, 'guan_yu', 'zhang_fei')).toBe(true);
        expect(areSwornBrothers(store, 'zhang_fei', 'guan_yu')).toBe(true);

        // 장비(신야 소속)를 포획: 허창 조조군이 신야를 공략하는 상황 시뮬레이션
        // processBattleSpoils(store, 공격도시, 수비도시) — 신야 함락 가정
        const defenders = store.getOfficersByCity('city_신야')
            .filter(o => o.status !== OfficerStatus.FREE && o.stats.intelligence < 100);
        expect(defenders.some(o => o.id === 'zhang_fei')).toBe(true);
        const rolls = defenders.map(o => ({ officerId: o.id, roll: o.id === 'zhang_fei' ? 0 : 0.99 }));
        processBattleSpoils(store, 'city_허창', 'city_신야', rolls);
        expect(isCaptive(store, 'zhang_fei')).toBe(true);
        expect(findRescuers(store, 'zhang_fei')).toContain('guan_yu');
    });

    it('judgeRescue — 무력이 높을수록 구출 확률 상승 (상한 70%)', () => {
        // 무력 0 → 25%
        expect(judgeRescue(0, BASE_RESCUE_CHANCE - 0.001)).toBe(true);
        expect(judgeRescue(0, BASE_RESCUE_CHANCE + 0.001)).toBe(false);
        // 무력 100 → 50%
        expect(judgeRescue(100, 0.49)).toBe(true);
        expect(judgeRescue(100, 0.51)).toBe(false);
        // 상한 클램프
        expect(judgeRescue(500, 0.69)).toBe(true);
        expect(judgeRescue(500, 0.71)).toBe(false);
    });

    /** 장비(신야)를 허창군이 포획하는 확정 셋업 */
    function captureZhangFei(store: GameStore) {
        const defenders = store.getOfficersByCity('city_신야')
            .filter(o => o.status !== OfficerStatus.FREE && o.stats.intelligence < 100);
        const rolls = defenders.map(o => ({ officerId: o.id, roll: o.id === 'zhang_fei' ? 0 : 0.99 }));
        return processBattleSpoils(store, 'city_허창', 'city_신야', rolls);
    }

    it('월간 구출 성공 시 포로가 의형제 도시로 합류 + 우호도 상승', () => {
        const { store } = setupWorld();
        store.addRelationship({ source: 'guan_yu', target: 'zhang_fei', type: 'SWORN_BROTHER', affinity: 50, history: [] });
        captureZhangFei(store); // 장비 포로 (허창 수용)
        expect(isCaptive(store, 'zhang_fei')).toBe(true);

        const affinityBefore = store.getRelationships('guan_yu').find(e => e.target === 'zhang_fei')!.affinity;

        // Math.random 스텁 — 구출 판정 roll 0.01 (성공)
        const realRandom = Math.random;
        Math.random = () => 0.01;
        let report: ReturnType<typeof processMonthlySwornBrotherRescues>;
        try {
            report = processMonthlySwornBrotherRescues(store);
        } finally {
            Math.random = realRandom;
        }

        expect(report.rescued.map(r => r.officerId)).toContain('zhang_fei');
        // 관우가 속한 세력의 도시로 합류
        const after = store.getOfficer('zhang_fei')!;
        const guanYuCity = store.getOfficer('guan_yu')!.cityId;
        expect(after.cityId).toBe(guanYuCity);
        // 포로 마커 해제 — 재시도 대상 아님
        expect(isCaptive(store, 'zhang_fei')).toBe(false);
        // 우호도 +30 양방향
        const affinityAfter = store.getRelationships('guan_yu').find(e => e.target === 'zhang_fei')!.affinity;
        expect(affinityAfter - affinityBefore).toBe(RESCUE_AFFINITY_BONUS);
        const reverse = store.getRelationships('zhang_fei').find(e => e.target === 'guan_yu')!;
        expect(reverse.affinity).toBe(affinityAfter);
    });

    it('월간 구출 실패 시 포로 상태 유지', () => {
        const { store } = setupWorld();
        store.addRelationship({ source: 'guan_yu', target: 'zhang_fei', type: 'SWORN_BROTHER', affinity: 50, history: [] });
        captureZhangFei(store);

        const realRandom = Math.random;
        Math.random = () => 0.99; // 구출 실패
        try {
            const report = processMonthlySwornBrotherRescues(store);
            expect(report.rescued).toHaveLength(0);
        } finally {
            Math.random = realRandom;
        }
        expect(isCaptive(store, 'zhang_fei')).toBe(true);
    });

    it('AI 포로 처형 시 군주 악명 상승 + 명성 하락', () => {
        const { store } = setupWorld();
        const target = store.getOfficersByCity('city_건업')
            .filter(o => o.status !== OfficerStatus.FREE && o.stats.intelligence < 100)[0];
        captureOnly(store, target.id);
        expect(isCaptive(store, target.id)).toBe(true);

        const leader = store.getOfficer('cao_cao')!;
        const infamyBefore = leader.infamy;
        const fameBefore = leader.fame;

        // Math.random 스텁 — 첫 roll = 처형 판정 (조조 무력78>지력94? 아니오 — 지력이 높으므로 온건형 10%)
        // roll 0.01 < 0.1 → 처형 성공
        const realRandom = Math.random;
        Math.random = () => 0.01;
        let report: ReturnType<typeof processCaptives>;
        try {
            report = processCaptives(store, 'fac_0', [target.id]);
        } finally {
            Math.random = realRandom;
        }

        expect(report.outcomes[0].decision).toBe('EXECUTE');
        const after = store.getOfficer('cao_cao')!;
        expect(after.infamy).toBe(infamyBefore + 30);
        expect(after.fame).toBe(fameBefore - 10);
        expect(report.messages.some(m => m.includes('악명'))).toBe(true);
    });

    it('AI 포로 석방 시 군주 명성 상승', () => {
        const { store } = setupWorld();
        const target = store.getOfficersByCity('city_건업')
            .filter(o => o.status !== OfficerStatus.FREE && o.stats.intelligence < 100)[0];
        const origin = getCapturedOriginFaction(store, target.id);
        void origin;
        captureOnly(store, target.id);

        const leader = store.getOfficer('cao_cao')!;
        const fameBefore = leader.fame;

        // roll 스텁: 처형 회피(0.5), 외교 판단 기피(0.99) → 석방 경로
        const calls: number[] = [];
        const realRandom = Math.random;
        Math.random = () => {
            calls.push(1);
            return calls.length === 1 ? 0.5 : 0.99;
        };
        let report: ReturnType<typeof processCaptives>;
        try {
            report = processCaptives(store, 'fac_0', [target.id]);
        } finally {
            Math.random = realRandom;
        }

        expect(report.outcomes[0].decision).toBe('RELEASE');
        const after = store.getOfficer('cao_cao')!;
        expect(after.fame).toBe(fameBefore + 15);
        expect(report.messages.some(m => m.includes('명성'))).toBe(true);
    });

    it('복수 성공/실패 시 주도자 명성 변동 (finishVengeance)', async () => {
        const { store } = setupWorld();
        store.addRelationship({ source: 'zhang_fei', target: 'zhuge_liang', type: 'NEMESIS', affinity: -80, history: [] });
        const zhangFei = store.getOfficer('zhang_fei')!;
        const fameBefore = zhangFei.fame;

        const { finishVengeance } = await import('../src/core/vengeance_system.js');
        const outcome = finishVengeance(store, 'zhang_fei', 'zhuge_liang', true);
        expect(outcome.success).toBe(true);
        const after = store.getOfficer('zhang_fei')!;
        expect(after.fame).toBe(fameBefore + 20);

        // 실패 시 -10
        const fame2 = after.fame;
        const outcome2 = finishVengeance(store, 'zhang_fei', 'zhuge_liang', false);
        expect(outcome2.success).toBe(false);
        expect(store.getOfficer('zhang_fei')!.fame).toBe(fame2 - 10);
    });
});
