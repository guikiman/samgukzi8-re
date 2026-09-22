import { describe, it, expect } from 'vitest';
import { GameStore } from '../src/core/game_store.js';
import { GameEngine } from '../src/core/game_engine.js';
import { buildWorld } from '../src/core/scenario_system.js';
import {
    getRoamingDialogue,
    resolveRoamingDialogue,
    roamingVisitorIcon,
    BANDIT_SUPPRESS_CHANCE,
} from '../src/core/roaming_dialogue_system.js';
import scenarioIndex from '../src/data/scenarios/index.json';

describe('로밍 이벤트 대화 시스템 [25][441-460][461-480]', () => {
    function setupWorld() {
        const store = new GameStore();
        const engine = new GameEngine(store);
        const scenario = (scenarioIndex as any[]).find(s => s.id === '05')!;
        const world = buildWorld(scenario, 0);
        engine.initWorld(world.officers, world.factions, world.cities, []);
        return { store, engine };
    }

    it('방문자 유형별 대화 씬과 선택지 3개가 생성된다', () => {
        for (const type of ['SAGE', 'HERMIT', 'MERCHANT', 'TRAVELER', 'BANDIT']) {
            const scene = getRoamingDialogue(type, '허창', '조조');
            expect(scene.options.length).toBe(3);
            expect(scene.title).toContain('허창');
            expect(scene.description.length).toBeGreaterThan(0);
        }
    });

    it('SAGE — 기술 상담은 도시 기술을 +8 한다', () => {
        const { store } = setupWorld();
        const city = store.getAllCities()[0];
        const before = city.developmentStats.technology;
        const result = resolveRoamingDialogue(store, 'SAGE', city.id, 'consult');
        expect(result.effects.join(' ')).toContain('기술 +8');
        expect(store.getCity(city.id)!.developmentStats.technology).toBe(
            Math.min(city.developmentStats.maxTechnology, before + 8));
    });

    it('SAGE — 경전 구입은 도시 자금 −100 / 군주 명성 +5', () => {
        const { store } = setupWorld();
        const city = store.getAllCities()[0];
        const faction = store.getFaction(city.ownerId!)!;
        const leader = store.getOfficer(faction.leaderId)!;
        const fundsBefore = city.funds;
        const fameBefore = leader.fame;
        resolveRoamingDialogue(store, 'SAGE', city.id, 'scripture');
        expect(store.getCity(city.id)!.funds).toBe(fundsBefore - 100);
        expect(store.getOfficer(leader.id)!.fame).toBe(fameBefore + 5);
    });

    it('HERMIT — 무례하면 군주 명성 −10 (음수 클램프 없음, 0 하한)', () => {
        const { store } = setupWorld();
        const city = store.getAllCities()[0];
        const faction = store.getFaction(city.ownerId!)!;
        const leader = store.getOfficer(faction.leaderId)!;
        const fameBefore = leader.fame;
        const result = resolveRoamingDialogue(store, 'HERMIT', city.id, 'rude');
        expect(store.getOfficer(leader.id)!.fame).toBe(Math.max(0, fameBefore - 10));
        expect(result.message).toContain('무례');
    });

    it('MERCHANT — 교역 허가는 세력 국고 +300', () => {
        const { store } = setupWorld();
        const city = store.getAllCities()[0];
        const faction = store.getFaction(city.ownerId!)!;
        const goldBefore = faction.gold;
        resolveRoamingDialogue(store, 'MERCHANT', city.id, 'trade');
        expect(store.getFaction(faction.id)!.gold).toBe(goldBefore + 300);
    });

    it('TRAVELER — 소문 청취는 치안 +5, 여비 지원은 자금 −100/명성 +5', () => {
        const { store } = setupWorld();
        const city = store.getAllCities()[0];
        const faction = store.getFaction(city.ownerId!)!;
        const leader = store.getOfficer(faction.leaderId)!;
        const orderBefore = city.developmentStats.publicOrder;
        const fameBefore = leader.fame;
        resolveRoamingDialogue(store, 'TRAVELER', city.id, 'listen');
        expect(store.getCity(city.id)!.developmentStats.publicOrder).toBe(
            Math.min(city.developmentStats.maxPublicOrder, orderBefore + 5));
        resolveRoamingDialogue(store, 'TRAVELER', city.id, 'fund');
        expect(store.getCity(city.id)!.funds).toBe(city.funds - 100);
        expect(store.getOfficer(leader.id)!.fame).toBe(fameBefore + 5);
    });

    it('BANDIT — 공물은 자금 −150, 진압 성공(roll<0.5)은 자금 +150/명성 +10', () => {
        const { store } = setupWorld();
        const city = store.getAllCities()[0];
        const faction = store.getFaction(city.ownerId!)!;
        const leader = store.getOfficer(faction.leaderId)!;
        expect(BANDIT_SUPPRESS_CHANCE).toBe(0.5);

        const funds0 = city.funds;
        resolveRoamingDialogue(store, 'BANDIT', city.id, 'tribute');
        expect(store.getCity(city.id)!.funds).toBe(funds0 - 150);

        const fame0 = store.getOfficer(leader.id)!.fame;
        const result = resolveRoamingDialogue(store, 'BANDIT', city.id, 'suppress', 0.1);
        expect(result.message).toContain('성공');
        expect(store.getCity(city.id)!.funds).toBe(funds0 - 150 + 150);
        expect(store.getOfficer(leader.id)!.fame).toBe(fame0 + 10);
    });

    it('BANDIT — 진압 실패(roll≥0.5)는 자금 −100', () => {
        const { store } = setupWorld();
        const city = store.getAllCities()[0];
        const fundsBefore = city.funds;
        const result = resolveRoamingDialogue(store, 'BANDIT', city.id, 'suppress', 0.9);
        expect(result.message).toContain('실패');
        expect(store.getCity(city.id)!.funds).toBe(fundsBefore - 100);
    });

    it('BANDIT — 방치는 자금 −200 / 치안 −5', () => {
        const { store } = setupWorld();
        const city = store.getAllCities()[0];
        const fundsBefore = city.funds;
        const orderBefore = city.developmentStats.publicOrder;
        resolveRoamingDialogue(store, 'BANDIT', city.id, 'ignore');
        expect(store.getCity(city.id)!.funds).toBe(fundsBefore - 200);
        expect(store.getCity(city.id)!.developmentStats.publicOrder).toBe(orderBefore - 5);
    });

    it('존재하지 않는 도시는 안전하게 처리된다', () => {
        const { store } = setupWorld();
        const result = resolveRoamingDialogue(store, 'SAGE', 'city_없음', 'consult');
        expect(result.message).toContain('찾을 수 없');
    });

    it('방문자 아이콘이 유형별로 할당된다', () => {
        expect(roamingVisitorIcon('SAGE')).toBe('🧙');
        expect(roamingVisitorIcon('BANDIT')).toBe('🗡️');
        expect(roamingVisitorIcon('UNKNOWN')).toBe('📍');
    });
});
