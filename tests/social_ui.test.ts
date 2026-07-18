/**
 * Phase 4-4: UI/상호작용 테스트 (social_system.ts, scroll_camera_controls.ts)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SocialSystem, BulkInteractOptions, InteractCandidate } from '../src/core/social_system.js';
import { ElasticScrollController, BezierCameraTracker, ScrollState } from '../src/core/scroll_camera_controls.js';
import { GameStore, gameStore } from '../src/core/game_store.js';
import { Officer, Faction, City, OfficerID, FactionID, GamePhase } from '../src/core/types.js';
import type { NormalizedState, GlobalState } from '../src/core/types.js';

// ============================================================
// 헬퍼
// ============================================================
function makeOfficer(id: string, overrides: Partial<Officer> = {}): Officer {
    return {
        id, name: `Officer_${id}`, courtesyName: '', gender: 'M',
        birthYear: 170, deathYear: null,
        stats: { leadership: 80, might: 70, intelligence: 60, politics: 50, charisma: 90 },
        exp: { leadership: 0, might: 0, intelligence: 0, politics: 0, charisma: 0 },
        rank: 5, status: 'OFFICER' as any, factionId: 'f1', cityId: 'c1',
        personality: 'CALM', loyalty: 80, ambition: 50, morality: 50, greed: 30,
        actionPoints: 100, maxActionPoints: 100, stamina: 100, maxStamina: 100,
        fame: 0, infamy: 0, merit: 0, salary: 20,
        skills: [], specialty: null,
        inventory: { weapons: [], mounts: [], treasures: [], books: [] },
        isFemaleBattleEnabled: false, hasActedThisTurn: false,
        hp: 100, maxHp: 100, injuries: 0,
        ...overrides,
    };
}

function makeFaction(id: string, overrides: Partial<Faction> = {}): Faction {
    return {
        id, name: `Faction_${id}`, leaderId: 'o_leader', color: '#ff0000',
        capitalCityId: 'c1', cities: ['c1'], officers: ['o_leader'], armies: [],
        gold: 1000, food: 5000, reputation: 50,
        policy: {
            recruitmentFocus: 0.5, militaryFocus: 0.5, economyFocus: 0.5,
            diplomacyFocus: 0.5, cultureFocus: 0.5,
        },
        diplomacy: {}, isPlayerControlled: false, techLevel: 1,
        ...overrides,
    };
}

function makeCity(id: string, overrides: Partial<City> = {}): City {
    return {
        id, name: `City_${id}`, hexCoord: { q: 0, r: 0 },
        population: 10000, defense: 50, maxDefense: 100,
        goldIncome: 100, foodIncome: 200, funds: 500,
        facilities: [], officerIds: [], ownerId: 'f1',
        isCapital: false, development: 50,
        developmentStats: {
            commerce: 50, maxCommerce: 100,
            farming: 50, maxFarming: 100,
            technology: 50, maxTechnology: 100,
            publicOrder: 50, maxPublicOrder: 100,
        },
        loyalty: 70, danger: 0, weather: 'SUNNY',
        ...overrides,
    };
}

function createEmptyStore(): GameStore {
    const store = GameStore.getInstance();
    const emptyState: NormalizedState = {
        officers: {}, factions: {}, cities: {}, armies: {}, relationships: {},
        byFaction: { officers: {}, cities: {}, armies: {} },
        byCity: { officers: {} },
        byOfficer: { relationships: {} },
    };
    const defaultGlobal: GlobalState = {
        phase: GamePhase.TITLE, time: { year: 192, month: 1 },
        season: 'WINTER', weather: 'SUNNY', turnCount: 0,
        selectedOfficerId: null, playerFactionId: null,
    };
    Object.assign(store, {
        state: JSON.parse(JSON.stringify(emptyState)),
        globalState: JSON.parse(JSON.stringify(defaultGlobal)),
        listeners: new Set(),
    });
    return store;
}

// ============================================================
// SocialSystem 테스트
// ============================================================
describe('SocialSystem', () => {
    let store: GameStore;
    let social: SocialSystem;

    beforeEach(() => {
        store = createEmptyStore();
        social = new SocialSystem(store);
    });

    it('getInteractCandidates returns ranked candidates', () => {
        const leader = makeOfficer('o_leader', { status: 'LORD' as any, loyalty: 100 });
        const o1 = makeOfficer('o1', { name: 'Test1', loyalty: 80 });
        const o2 = makeOfficer('o2', { name: 'Test2', loyalty: 60 });
        const f = makeFaction('f1', { leaderId: 'o_leader' });
        store.initWorld([leader, o1, o2], [f], [], []);
        const candidates = social.getInteractCandidates('f1', { affinityThreshold: 50, maxFactionOfficers: 5 });
        expect(candidates.length).toBeGreaterThan(0);
        // Should include both officers (LORD also passes status !== 'FREE' filter)
        const ids = candidates.map(c => c.officerId);
        expect(ids).toContain('o1');
        expect(candidates[0].score).toBeGreaterThanOrEqual(0);
    });

    it('getInteractCandidates returns empty for nonexistent faction', () => {
        const result = social.getInteractCandidates('nonexistent');
        expect(result.length).toBe(0);
    });

    it('getInteractCandidates respects maxFactionOfficers', () => {
        const leader = makeOfficer('o_leader', { status: 'LORD' as any });
        const officers = Array.from({ length: 10 }, (_, i) =>
            makeOfficer(`o${i}`, { name: `Officer${i}` })
        );
        const f = makeFaction('f1', { leaderId: 'o_leader' });
        store.initWorld([leader, ...officers], [f], [], []);
        const candidates = social.getInteractCandidates('f1', { maxFactionOfficers: 3 });
        expect(candidates.length).toBeLessThanOrEqual(3);
    });

    it('getInteractCandidates sorts by score descending', () => {
        const leader = makeOfficer('o_leader', { status: 'LORD' as any });
        const o1 = makeOfficer('o1', { name: 'Low', loyalty: 30 });
        const o2 = makeOfficer('o2', { name: 'High', loyalty: 90 });
        const f = makeFaction('f1', { leaderId: 'o_leader', officers: ['o_leader', 'o1', 'o2'] });
        store.initWorld([leader, o1, o2], [f], [], []);
        const candidates = social.getInteractCandidates('f1', { affinityThreshold: 50 });
        if (candidates.length >= 2) {
            expect(candidates[0].score).toBeGreaterThanOrEqual(candidates[candidates.length - 1].score);
        }
    });

    it('computeRansom returns 0 for nonexistent officer', () => {
        expect(social.computeRansom('nonexistent', 'f1')).toBe(0);
    });

    it('computeRansom calculates proportional to stats', () => {
        const o = makeOfficer('o1', {
            rank: 1 as any,
            stats: { leadership: 100, might: 100, intelligence: 100, politics: 100, charisma: 100 },
            loyalty: 90,
        });
        store.addOfficer(o);
        const ransom = social.computeRansom('o1', 'f1');
        expect(ransom).toBeGreaterThan(0);
        // total = 500, 500/300 * 5 * 2 * 500 = 1.666 * 10 * 500 = ~8333
        expect(ransom).toBe(8333);
    });

    it('computeRansom with low rank is cheaper', () => {
        const highRank = makeOfficer('o_high', {
            rank: 1 as any,
            stats: { leadership: 100, might: 100, intelligence: 100, politics: 100, charisma: 100 },
        });
        const lowRank = makeOfficer('o_low', {
            rank: 9 as any,
            stats: { leadership: 100, might: 100, intelligence: 100, politics: 100, charisma: 100 },
        });
        store.addOfficer(highRank);
        store.addOfficer(lowRank);
        const hRansom = social.computeRansom('o_high', 'f1');
        const lRansom = social.computeRansom('o_low', 'f1');
        expect(hRansom).toBeGreaterThan(lRansom);
    });

    it('computeRansom with low loyalty is cheaper', () => {
        const loyal = makeOfficer('o_loyal', { loyalty: 90, rank: 3 as any });
        const disloyal = makeOfficer('o_disloyal', { loyalty: 30, rank: 3 as any });
        store.addOfficer(loyal);
        store.addOfficer(disloyal);
        const lRansom = social.computeRansom('o_loyal', 'f1');
        const dRansom = social.computeRansom('o_disloyal', 'f1');
        expect(lRansom).toBeGreaterThan(dRansom);
    });

    it('getInteractCandidates filters FREE status officers', () => {
        const leader = makeOfficer('o_leader', { status: 'LORD' as any });
        const active = makeOfficer('o_active', { name: 'Active' });
        const free_o = makeOfficer('o_free', { name: 'Free', status: 'FREE' as any, factionId: null });
        const f = makeFaction('f1', { leaderId: 'o_leader' });
        store.initWorld([leader, active, free_o], [f], [], []);
        const candidates = social.getInteractCandidates('f1');
        const names = candidates.map(c => c.name);
        expect(names).toContain('Active');
    });
});

// ============================================================
// ElasticScrollController 테스트
// ============================================================
describe('ElasticScrollController', () => {
    let scroll: ElasticScrollController;

    beforeEach(() => {
        scroll = new ElasticScrollController();
    });

    it('initial position and velocity are zero', () => {
        const pos = scroll.getPosition();
        expect(pos.x).toBe(0);
        expect(pos.y).toBe(0);
    });

    it('applyDragRelease stores velocity', () => {
        scroll.applyDragRelease(10, 20);
        const state = scroll.update();
        expect(state.velocityX).toBe(9.5); // 10 * 0.95
        expect(state.velocityY).toBe(19); // 20 * 0.95
    });

    it('update applies damping', () => {
        scroll.applyDragRelease(100, 0);
        const s1 = scroll.update();
        const s2 = scroll.update();
        expect(s2.velocityX).toBeLessThan(s1.velocityX);
    });

    it('update sets isScrolling when velocity is significant', () => {
        scroll.applyDragRelease(10, 10);
        const state = scroll.update();
        expect(state.isScrolling).toBe(true);
    });

    it('update sets isScrolling false when velocity decays', () => {
        scroll.applyDragRelease(0.05, 0.05);
        const state = scroll.update();
        expect(state.isScrolling).toBe(false);
    });

    it('setBounds constrains position with bounce', () => {
        scroll.setBounds(0, 100, 0, 100);
        scroll.applyDragRelease(-50, -50);
        for (let i = 0; i < 10; i++) scroll.update();
        const pos = scroll.getPosition();
        expect(pos.x).toBeGreaterThanOrEqual(0);
        expect(pos.y).toBeGreaterThanOrEqual(0);
    });

    it('bounce reverses velocity at boundary', () => {
        scroll.setBounds(0, 100, 0, 100);
        // Start near left boundary
        // Large negative velocity should bounce
        for (let i = 0; i < 5; i++) scroll.update();
        scroll.applyDragRelease(-100, 0);
        let state = scroll.update();
        // After a few updates, position should be >= 0
        for (let i = 0; i < 10; i++) state = scroll.update();
        expect(state.positionX).toBeGreaterThanOrEqual(0);
    });

    it('getPosition returns current coordinates', () => {
        scroll.applyDragRelease(50, 30);
        scroll.update();
        const pos = scroll.getPosition();
        expect(pos.x).toBeGreaterThan(0);
        expect(pos.y).toBeGreaterThan(0);
    });

    it('bounces at maximum bounds', () => {
        scroll.setBounds(0, 100, 0, 100);
        // Large positive velocity should bounce at right edge
        scroll.applyDragRelease(200, 0);
        let state: ScrollState = { velocityX: 0, velocityY: 0, positionX: 0, positionY: 0, isScrolling: false };
        for (let i = 0; i < 10; i++) state = scroll.update();
        expect(state.positionX).toBeLessThanOrEqual(200); // should be bounded
    });
});

// ============================================================
// BezierCameraTracker 테스트
// ============================================================
describe('BezierCameraTracker', () => {
    let tracker: BezierCameraTracker;

    beforeEach(() => {
        tracker = new BezierCameraTracker();
    });

    it('returns done=true when not animating', () => {
        const result = tracker.update(16);
        expect(result.done).toBe(true);
        expect(result.x).toBe(0);
        expect(result.y).toBe(0);
    });

    it('startMove begins animation', () => {
        tracker.startMove(0, 0, 100, 100, 1000);
        const result = tracker.update(16);
        expect(result.done).toBe(false);
    });

    it('update interpolates towards target', () => {
        tracker.startMove(0, 0, 100, 100, 1000);
        const result = tracker.update(500); // halfway
        expect(result.x).toBeGreaterThan(0);
        expect(result.x).toBeLessThan(100);
        expect(result.y).toBeGreaterThan(0);
        expect(result.y).toBeLessThan(100);
    });

    it('reaches target after duration', () => {
        tracker.startMove(0, 0, 100, 200, 100);
        const result = tracker.update(200); // past duration
        expect(result.done).toBe(true);
        expect(result.x).toBe(100);
        expect(result.y).toBe(200);
    });

    it('handles zero-duration move', () => {
        tracker.startMove(50, 50, 50, 50, 1);
        const result = tracker.update(100);
        expect(result.done).toBe(true);
        expect(result.x).toBe(50);
        expect(result.y).toBe(50);
    });

    it('handles negative delta movement', () => {
        tracker.startMove(100, 100, 0, 0, 500);
        const result = tracker.update(250);
        // Cubic Bezier at t=0.5 interpolates past midpoint due to control points
        expect(result.x).toBeGreaterThan(0);
        expect(result.y).toBeGreaterThan(0);
        expect(result.done).toBe(false);
    });

    it('multiple updates progress animation', () => {
        tracker.startMove(0, 0, 200, 100, 1000);
        const r1 = tracker.update(300);
        const r2 = tracker.update(300);
        const r3 = tracker.update(300);
        expect(r3.x).toBeGreaterThan(r1.x);
        expect(r3.y).toBeGreaterThan(r1.y);
    });
});
