import { describe, it, expect } from 'vitest';
import { GameStore } from '../src/core/game_store.js';
import { GameEngine } from '../src/core/game_engine.js';
import { buildWorld } from '../src/core/scenario_system.js';
import {
    getReputationRecruitModifier,
    getReputationDiplomacyModifier,
    applyReputationToRecruitChance,
    describeReputationModifier,
} from '../src/core/reputation_effect_system.js';
import {
    findPactCandidates,
    executeSwornBrotherPact,
    processMonthlySwornBrotherPacts,
    PACT_MIN_AFFINITY,
} from '../src/core/sworn_brother_pact_system.js';
import { areSwornBrothers } from '../src/core/sworn_brother_rescue_system.js';
import {} from '../src/core/types.js';
import scenarioIndex from '../src/data/scenarios/index.json';

describe('평판 효과 + 의형제 결의 [11][24][341-360][25]', () => {
    function setupWorld() {
        const store = new GameStore();
        const engine = new GameEngine(store);
        const scenario = (scenarioIndex as Array<{ id: string }>).find(s => s.id === '05')!;
        const world = buildWorld(scenario as never, 0);
        engine.initWorld(world.officers, world.factions, world.cities, []);
        store.setGlobalState({ playerFactionId: 'fac_0' });
        return { store, engine, world };
    }

    // ── ① 평판 효과 ──

    it('명성 높은 군주 → 등용 보정 +, 악명 높은 군주 → 등용 페널티', () => {
        const { store } = setupWorld();
        const caoCao = store.getOfficer('cao_cao')!; // 조조 세력 군주
        const baseFame = caoCao.fame;
        const baseInfamy = caoCao.infamy;

        // 명성 상승 → 보정 플러스
        store.updateOfficer('cao_cao', { fame: baseFame + 300, infamy: 0 });
        const highRep = getReputationRecruitModifier(store, 'fac_0');
        expect(highRep).toBeGreaterThan(0);

        // 악명 폭등 → 페널티
        store.updateOfficer('cao_cao', { fame: 0, infamy: baseInfamy + 100 });
        const lowRep = getReputationRecruitModifier(store, 'fac_0');
        expect(lowRep).toBeLessThan(0);
        // 클램프 확인
        expect(lowRep).toBeGreaterThanOrEqual(-0.10);
        expect(highRep).toBeLessThanOrEqual(0.10);
    });

    it('평판 보정이 등용 확률에 반영된다 (applyReputationToRecruitChance)', () => {
        const { store } = setupWorld();
        store.updateOfficer('cao_cao', { fame: 800, infamy: 0 });
        const base = 0.5;
        const boosted = applyReputationToRecruitChance(store, 'fac_0', base);
        expect(boosted).toBeGreaterThan(base);
        // 클램프
        expect(applyReputationToRecruitChance(store, 'fac_0', 0.9)).toBeLessThanOrEqual(0.95);
    });

    it('외교 수락률 보정 — 명성 +, 악명 − (클램프 ±0.15)', () => {
        const { store } = setupWorld();
        store.updateOfficer('cao_cao', { fame: 900, infamy: 0 });
        const good = getReputationDiplomacyModifier(store, 'fac_0');
        expect(good).toBeGreaterThan(0);
        store.updateOfficer('cao_cao', { fame: 0, infamy: 300 });
        const bad = getReputationDiplomacyModifier(store, 'fac_0');
        expect(bad).toBeLessThan(0);
        expect(bad).toBeGreaterThanOrEqual(-0.15);
        expect(good).toBeLessThanOrEqual(0.15);
    });

    it('describeReputationModifier — 보정 크기에 따라 라벨 분기', () => {
        expect(describeReputationModifier(0.08)).toContain('명성 보정');
        expect(describeReputationModifier(-0.08)).toContain('악명 페널티');
        expect(describeReputationModifier(0)).toBe('');
    });

    it('loyaltySystem.getRecruitChance에 평판 보정이 반영된다', () => {
        const { store, engine } = setupWorld();
        const loyalty = engine['loyaltySystem'];
        const target = store.getAllOfficers().find(o => o.factionId === 'fac_2' && o.id !== 'liu_bei')!;

        store.updateOfficer('cao_cao', { fame: 900, infamy: 0 });
        const chanceHigh = loyalty.getRecruitChance(target.id, undefined, 'fac_0');
        store.updateOfficer('cao_cao', { fame: 0, infamy: 400 });
        const chanceLow = loyalty.getRecruitChance(target.id, undefined, 'fac_0');
        expect(chanceHigh).toBeGreaterThan(chanceLow);
    });

    // ── ③ 의형제 결의 ──

    it('findPactCandidates — 우호도 70+ 같은 세력 쌍만 후보', () => {
        const { store } = setupWorld();
        // 관우↔장비 (같은 유비 세력) — 우호도 75로 후보
        store.addRelationship({ source: 'guan_yu', target: 'zhang_fei', type: 'FRIEND', affinity: 75, history: [] });
        store.addRelationship({ source: 'zhang_fei', target: 'guan_yu', type: 'FRIEND', affinity: 75, history: [] });
        // 조조↔손권 (다른 세력) — 우호도 높아도 후보 아님
        store.addRelationship({ source: 'cao_cao', target: 'sun_quan', type: 'FRIEND', affinity: 95, history: [] });
        store.addRelationship({ source: 'sun_quan', target: 'cao_cao', type: 'FRIEND', affinity: 95, history: [] });

        const candidates = findPactCandidates(store);
        expect(candidates.some(c => (c.aId === 'guan_yu' && c.bId === 'zhang_fei') || (c.aId === 'zhang_fei' && c.bId === 'guan_yu'))).toBe(true);
        // 다른 세력 쌍 제외
        expect(candidates.some(c => (c.aId === 'cao_cao' && c.bId === 'sun_quan') || (c.aId === 'sun_quan' && c.bId === 'cao_cao'))).toBe(false);
    });

    it('executeSwornBrotherPact — SWORN_BROTHER 엣지 생성 + 세력 평판 상승', () => {
        const { store } = setupWorld();
        const repBefore = store.getFaction('fac_2')!.reputation;

        const record = executeSwornBrotherPact(store, 'guan_yu', 'zhang_fei');
        expect(record).not.toBeNull();
        expect(areSwornBrothers(store, 'guan_yu', 'zhang_fei')).toBe(true);
        // 재결의 시도 — null 반환
        expect(executeSwornBrotherPact(store, 'guan_yu', 'zhang_fei')).toBeNull();
        // 평판 상승
        expect(store.getFaction('fac_2')!.reputation).toBe(repBefore + 3);
    });

    it('processMonthlySwornBrotherPacts — 월간 판정에서 결의가 발생한다', () => {
        const { store } = setupWorld();
        store.addRelationship({ source: 'guan_yu', target: 'zhang_fei', type: 'FRIEND', affinity: 90, history: [] });
        store.addRelationship({ source: 'zhang_fei', target: 'guan_yu', type: 'FRIEND', affinity: 90, history: [] });

        const realRandom = Math.random;
        Math.random = () => 0.01; // 결의 확률 통과
        try {
            const report = processMonthlySwornBrotherPacts(store);
            expect(report.pacts).toHaveLength(1);
            expect(report.messages.some(m => m.includes('의형제'))).toBe(true);
        } finally {
            Math.random = realRandom;
        }
        expect(areSwornBrothers(store, 'guan_yu', 'zhang_fei')).toBe(true);
    });
});
