/**
 * Phase 4-2: 외교/내정 테스트 (diplomacy_engine.ts, domestic_scheduler.ts)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { DiplomacyEngine, FactionRelation } from '../src/core/diplomacy_engine.js';
import { DomesticScheduler, DomesticTaskType, TaskAssignment, DomesticTask } from '../src/core/domestic_scheduler.js';
import { GameStore, gameStore } from '../src/core/game_store.js';
import { Officer, Faction, City, OfficerID, CityID, GamePhase } from '../src/core/types.js';
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
        id, name: `Faction_${id}`, leaderId: 'o1', color: '#ff0000',
        capitalCityId: 'c1', cities: ['c1'], officers: ['o1'], armies: [],
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
// DiplomacyEngine 테스트
// ============================================================
describe('DiplomacyEngine', () => {
    let de: DiplomacyEngine;

    beforeEach(() => {
        de = new DiplomacyEngine();
        de.setFactionData('f1', { totalPower: 100, gold: 5000 });
        de.setFactionData('f2', { totalPower: 80, gold: 3000 });
        de.setFactionData('f3', { totalPower: 0, gold: 0 });
    });

    it('getRelation defaults to NEUTRAL', () => {
        expect(de.getRelation('f1', 'f2')).toBe(FactionRelation.NEUTRAL);
        expect(de.getRelation('unknown', 'f2')).toBe(FactionRelation.NEUTRAL);
    });

    it('setRelation updates relation', () => {
        de.setRelation('f1', 'f2', FactionRelation.ALLIANCE);
        expect(de.getRelation('f1', 'f2')).toBe(FactionRelation.ALLIANCE);
    });

    it('formAlliance changes NEUTRAL to ALLIANCE', () => {
        const result = de.formAlliance('f1', 'f2');
        expect(result.success).toBe(true);
        expect(de.getRelation('f1', 'f2')).toBe(FactionRelation.ALLIANCE);
    });

    it('formAlliance on WAR returns failure', () => {
        de.setRelation('f1', 'f2', FactionRelation.WAR);
        const result = de.formAlliance('f1', 'f2');
        expect(result.success).toBe(false);
    });

    it('breakAlliance changes ALLIANCE to NEUTRAL', () => {
        de.setRelation('f1', 'f2', FactionRelation.ALLIANCE);
        const result = de.breakAlliance('f1', 'f2');
        expect(result.success).toBe(true);
        expect(de.getRelation('f1', 'f2')).toBe(FactionRelation.NEUTRAL);
    });

    it('breakAlliance on NEUTRAL returns failure', () => {
        const result = de.breakAlliance('f1', 'f2');
        expect(result.success).toBe(false);
    });

    it('declareWar sets relation to WAR', () => {
        const result = de.declareWar('f1', 'f2');
        expect(result.success).toBe(true);
        expect(de.getRelation('f1', 'f2')).toBe(FactionRelation.WAR);
    });

    it('persuadeSurrender with 3x power succeeds', () => {
        de.setFactionData('f1', { totalPower: 300, gold: 5000 });
        de.setFactionData('f2', { totalPower: 80, gold: 3000 });
        const result = de.persuadeSurrender('f2', 'f1');
        expect(result.success).toBe(true);
    });

    it('persuadeSurrender with equal power fails', () => {
        de.setFactionData('f1', { totalPower: 100, gold: 5000 });
        de.setFactionData('f2', { totalPower: 100, gold: 3000 });
        const result = de.persuadeSurrender('f2', 'f1');
        expect(result.success).toBe(false);
    });

    it('persuadeSurrender with 0 power auto-succeeds', () => {
        const result = de.persuadeSurrender('f3', 'f1');
        expect(result.success).toBe(true);
    });

    it('persuadeSurrender with missing data returns failure', () => {
        const result = de.persuadeSurrender('nonexistent', 'f1');
        expect(result.success).toBe(false);
    });

    it('sendGift to neutral upgrades to ALLIANCE', () => {
        const result = de.sendGift('f1', 'f2', 500, 1000);
        expect(result.success).toBe(true);
        expect(de.getRelation('f1', 'f2')).toBe(FactionRelation.ALLIANCE);
    });

    it('sendGift at war returns failure', () => {
        de.setRelation('f1', 'f2', FactionRelation.WAR);
        const result = de.sendGift('f1', 'f2', 500, 1000);
        expect(result.success).toBe(false);
    });

    it('requestReinforcements from non-ally returns failure', () => {
        const result = de.requestReinforcements('f1', 'f2');
        expect(result.success).toBe(false);
    });

    it('requestReinforcements from ally may succeed', () => {
        de.setRelation('f1', 'f2', FactionRelation.ALLIANCE);
        const result = de.requestReinforcements('f1', 'f2');
        // 70% success rate, can be either
        expect(result.message).toBeDefined();
    });

    it('sabotage with insufficient gold returns failure', () => {
        const result = de.sabotage('city1', 50);
        expect(result.success).toBe(false);
    });

    it('sabotage with sufficient gold succeeds', () => {
        const origRandom = Math.random;
        Math.random = () => 0.05; // successChance = min(70, floor(500/50)) = 10, need <= 0.1
        const result = de.sabotage('city1', 500);
        expect(result.success).toBe(true);
        Math.random = origRandom;
    });

    it('sowDiscord with insufficient gold returns failure', () => {
        const result = de.sowDiscord('officer1', 100);
        expect(result.success).toBe(false);
    });

    it('sowDiscord returns loyaltyDrop on success', () => {
        const origRandom = Math.random;
        Math.random = () => 0.02; // successChance = min(60, floor(500/100)) = 5, need <= 0.05
        const result = de.sowDiscord('officer1', 500);
        expect(result.success).toBe(true);
        expect(result.loyaltyDrop).toBe(20);
        Math.random = origRandom;
    });

    it('formVassalage sets relation to SURRENDERED', () => {
        const result = de.formVassalage('f1', 'f2');
        expect(result).toBe(true);
        expect(de.getRelation('f1', 'f2')).toBe(FactionRelation.SURRENDERED);
    });

    it('exchangeHostages with ALLIANCE returns true', () => {
        de.setRelation('f1', 'f2', FactionRelation.ALLIANCE);
        expect(de.exchangeHostages('f1', 'f2')).toBe(true);
    });

    it('exchangeHostages without ALLIANCE returns false', () => {
        expect(de.exchangeHostages('f1', 'f2')).toBe(false);
    });

    it('declareProxyWar sets proxy to WAR with target', () => {
        const result = de.declareProxyWar('f1', 'f3', 'f2');
        expect(result).toBe(true);
        expect(de.getRelation('f2', 'f3')).toBe(FactionRelation.WAR);
    });

    it('negotiateRelease with enough gold succeeds', () => {
        const result = de.negotiateRelease(500);
        expect(result.success).toBe(true);
    });

    it('negotiateRelease with insufficient gold fails', () => {
        const result = de.negotiateRelease(200);
        expect(result.success).toBe(false);
    });

    it('plantSpy returns result', () => {
        const origRandom = Math.random;
        Math.random = () => 0.2;
        const result = de.plantSpy();
        expect(result.success).toBe(true);
        Math.random = origRandom;
    });

    it('spreadRumor returns success', () => {
        const result = de.spreadRumor('f2');
        expect(result.success).toBe(true);
    });

    it('key function is symmetric', () => {
        de.setRelation('f1', 'f2', FactionRelation.ALLIANCE);
        expect(de.getRelation('f1', 'f2')).toBe(FactionRelation.ALLIANCE);
        expect(de.getRelation('f2', 'f1')).toBe(FactionRelation.ALLIANCE);
    });
});

// ============================================================
// DomesticScheduler 테스트
// ============================================================
describe('DomesticScheduler', () => {
    let store: GameStore;
    let scheduler: DomesticScheduler;

    beforeEach(() => {
        store = createEmptyStore();
        scheduler = new DomesticScheduler(store);
    });

    it('autoAssign returns ranked assignments', () => {
        const o1 = makeOfficer('o1', { stats: { leadership: 80, might: 70, intelligence: 60, politics: 90, charisma: 85 } });
        const o2 = makeOfficer('o2', { stats: { leadership: 70, might: 60, intelligence: 50, politics: 40, charisma: 45 } });
        const c = makeCity('c1', { officerIds: ['o1', 'o2'] });
        store.initWorld([o1, o2], [], [c], []);
        const assignments = scheduler.autoAssign('c1', ['commerce']);
        expect(assignments.length).toBe(1);
        expect(assignments[0].officerId).toBe('o1');
        expect(assignments[0].score).toBeGreaterThan(0);
    });

    it('autoAssign with excludeIds filters correctly', () => {
        const o1 = makeOfficer('o1');
        const o2 = makeOfficer('o2');
        const c = makeCity('c1', { officerIds: ['o1', 'o2'] });
        store.initWorld([o1, o2], [], [c], []);
        const assignments = scheduler.autoAssign('c1', ['commerce', 'agriculture'], new Set(['o1']));
        // 2 slots but only 1 available officer (o1 excluded) → 1 assignment
        expect(assignments.length).toBe(1);
        expect(assignments[0].officerId).toBe('o2');
    });

    it('autoAssign returns empty for city with no officers', () => {
        const c = makeCity('c1', { officerIds: [] });
        store.initWorld([], [], [c], []);
        const assignments = scheduler.autoAssign('c1', ['commerce']);
        expect(assignments.length).toBe(0);
    });

    it('registerAssignment validates minimum funds', () => {
        const o = makeOfficer('o1');
        const c = makeCity('c1', { funds: 100 });
        store.initWorld([o], [], [c], []);
        expect(() => {
            const assignment: TaskAssignment = {
                taskType: DomesticTaskType.COMMERCE,
                officerIds: ['o1'],
                allocatedFunds: 30,
            };
            scheduler.registerAssignment('c1', assignment);
        }).toThrow('최소 할당 비용');
    });

    it('registerAssignment validates city funds', () => {
        const o = makeOfficer('o1');
        const c = makeCity('c1', { funds: 30 });
        store.initWorld([o], [], [c], []);
        expect(() => {
            const assignment: TaskAssignment = {
                taskType: DomesticTaskType.COMMERCE,
                officerIds: ['o1'],
                allocatedFunds: 100,
            };
            scheduler.registerAssignment('c1', assignment);
        }).toThrow('보유 금');
    });

    it('registerAssignment validates officer AP', () => {
        const o = makeOfficer('o1', { actionPoints: 5 });
        const c = makeCity('c1', { funds: 500 });
        store.initWorld([o], [], [c], []);
        expect(() => {
            const assignment: TaskAssignment = {
                taskType: DomesticTaskType.COMMERCE,
                officerIds: ['o1'],
                allocatedFunds: 100,
            };
            scheduler.registerAssignment('c1', assignment);
        }).toThrow('행동력');
    });

    it('registerAssignment with non-existent city throws', () => {
        const o = makeOfficer('o1');
        store.addOfficer(o);
        expect(() => {
            const assignment: TaskAssignment = {
                taskType: DomesticTaskType.COMMERCE,
                officerIds: ['o1'],
                allocatedFunds: 100,
            };
            scheduler.registerAssignment('nonexistent' as CityID, assignment);
        }).toThrow('존재하지 않습니다');
    });

    it('registerAssignment with non-existent officer throws', () => {
        const c = makeCity('c1', { funds: 500 });
        store.initWorld([], [], [c], []);
        expect(() => {
            const assignment: TaskAssignment = {
                taskType: DomesticTaskType.COMMERCE,
                officerIds: ['o1'],
                allocatedFunds: 100,
            };
            scheduler.registerAssignment('c1', assignment);
        }).toThrow('존재하지 않습니다');
    });

    it('registerAssignment succeeds with valid params', () => {
        const o = makeOfficer('o1');
        const c = makeCity('c1', { funds: 500 });
        store.initWorld([o], [], [c], []);
        const assignment: TaskAssignment = {
            taskType: DomesticTaskType.COMMERCE,
            officerIds: ['o1'],
            allocatedFunds: 100,
        };
        expect(() => scheduler.registerAssignment('c1', assignment)).not.toThrow();
        expect(scheduler.pendingCount).toBe(1);
    });

    it('executeAll clears pending queue', () => {
        const o = makeOfficer('o1');
        const c = makeCity('c1', { funds: 500 });
        store.initWorld([o], [], [c], []);
        const assignment: TaskAssignment = {
            taskType: DomesticTaskType.COMMERCE,
            officerIds: ['o1'],
            allocatedFunds: 100,
        };
        scheduler.registerAssignment('c1', assignment);
        const results = scheduler.executeAll();
        expect(results.length).toBe(1);
        expect(scheduler.pendingCount).toBe(0);
    });

    it('executeAll returns empty for no assignments', () => {
        const results = scheduler.executeAll();
        expect(results.length).toBe(0);
    });

    it('executeAll deducts AP and updates city', () => {
        const o = makeOfficer('o1', { actionPoints: 100 });
        const c = makeCity('c1', { funds: 500 });
        store.initWorld([o], [], [c], []);
        const assignment: TaskAssignment = {
            taskType: DomesticTaskType.COMMERCE,
            officerIds: ['o1'],
            allocatedFunds: 100,
        };
        scheduler.registerAssignment('c1', assignment);
        scheduler.executeAll();
        expect(store.getOfficer('o1')!.actionPoints).toBe(80); // 100 - 20 AP cost
        expect(store.getCity('c1')!.funds).toBe(400); // 500 - 100
    });

    it('checkAutoTransition detects maxed farming', () => {
        const c = makeCity('c1', {
            developmentStats: {
                commerce: 50, maxCommerce: 100,
                farming: 100, maxFarming: 100,
                technology: 50, maxTechnology: 100,
                publicOrder: 50, maxPublicOrder: 100,
            },
        });
        store.initWorld([], [], [c], []);
        const rule = scheduler.checkAutoTransition('c1');
        expect(rule).not.toBeNull();
        expect(rule!.sourceTask).toBe('agriculture');
        expect(rule!.targetTask).toBe('fortify');
    });

    it('checkAutoTransition detects maxed commerce', () => {
        const c = makeCity('c1', {
            developmentStats: {
                commerce: 100, maxCommerce: 100,
                farming: 50, maxFarming: 100,
                technology: 50, maxTechnology: 100,
                publicOrder: 50, maxPublicOrder: 100,
            },
        });
        store.initWorld([], [], [c], []);
        const rule = scheduler.checkAutoTransition('c1');
        expect(rule).not.toBeNull();
        expect(rule!.sourceTask).toBe('commerce');
        expect(rule!.targetTask).toBe('public_order');
    });

    it('checkAutoTransition returns null when nothing is maxed', () => {
        const c = makeCity('c1', {
            developmentStats: {
                commerce: 50, maxCommerce: 100,
                farming: 50, maxFarming: 100,
                technology: 50, maxTechnology: 100,
                publicOrder: 50, maxPublicOrder: 100,
            },
        });
        store.initWorld([], [], [c], []);
        const rule = scheduler.checkAutoTransition('c1');
        expect(rule).toBeNull();
    });

    it('checkAutoTransition on nonexistent city returns null', () => {
        const rule = scheduler.checkAutoTransition('nonexistent' as CityID);
        expect(rule).toBeNull();
    });

    it('scanAllAutoTransitions returns transitions for all cities', () => {
        const c1 = makeCity('c1', {
            developmentStats: {
                commerce: 100, maxCommerce: 100,
                farming: 50, maxFarming: 100,
                technology: 50, maxTechnology: 100,
                publicOrder: 50, maxPublicOrder: 100,
            },
        });
        const c2 = makeCity('c2', {
            developmentStats: {
                commerce: 50, maxCommerce: 100,
                farming: 50, maxFarming: 100,
                technology: 50, maxTechnology: 100,
                publicOrder: 50, maxPublicOrder: 100,
            },
        });
        store.initWorld([], [], [c1, c2], []);
        const transitions = scheduler.scanAllAutoTransitions();
        expect(transitions.length).toBe(1);
        expect(transitions[0].cityId).toBe('c1');
    });

    it('calculateScore gives higher weight to politics', () => {
        const o1 = makeOfficer('o1', { stats: { leadership: 80, might: 70, intelligence: 60, politics: 90, charisma: 50 } });
        const o2 = makeOfficer('o2', { stats: { leadership: 80, might: 70, intelligence: 60, politics: 50, charisma: 50 } });
        store.initWorld([o1, o2], [], [], []);
        // Higher politics = higher score
        const a1 = scheduler.autoAssign('c1', ['commerce']);
        // o1 has higher politics
    });
});
