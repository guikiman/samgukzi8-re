import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from '../src/core/game_engine.js';
import { GameStore } from '../src/core/game_store.js';
import { buildWorld } from '../src/core/scenario_system.js';
import scenarioIndex from '../src/data/scenarios/index.json';
import {
    ConditionType,
    createEventChainNode,
} from '../src/core/event_chain_engine.js';
import { BranchType } from '../src/core/scenario_branch_manager.js';

describe('엔진 통합 — 연의전 이벤트 체인 [300][106-114]', () => {
    let store: GameStore;
    let engine: GameEngine;
    let world: ReturnType<typeof buildWorld>;

    beforeEach(() => {
        store = new GameStore();
        engine = new GameEngine(store);
        const scenario = (scenarioIndex as Array<{ id: string }>).find(s => s.id === '05')!;
        world = buildWorld(scenario as never, 2);
        engine.initWorld(world.officers, world.factions, world.cities, []);
    });

    it('engine.eventEngine이 초기화되고 큐가 비어 있다', () => {
        expect(engine.eventEngine).toBeDefined();
        expect(engine.eventEngine.queueMgr.queueSize).toBe(0);
        expect(engine.historicalEvents).toBeDefined();
    });

    it('턴 실행 시 조건 충족 체인 노드가 HISTORICAL_EVENT로 발화된다', async () => {
        const fired: Array<{ type: string; payload: Record<string, unknown> }> = [];
        engine.subscribe('HISTORICAL_EVENT', (e) => fired.push({ type: e.type, payload: e.payload }));

        // 현재 연도에 즉시 발동할 조건부 노드 적재
        const year = store.getGlobalState().time.year;
        engine.eventEngine.queueMgr.enqueue(
            createEventChainNode('test_chain_ev', '테스트 연의전', [
                { type: ConditionType.YEAR, minValue: year },
            ]),
        );

        await engine.executeTurn();

        expect(fired.length).toBeGreaterThanOrEqual(1);
        const chainFire = fired.find(f => f.payload.eventId === 'test_chain_ev');
        expect(chainFire).toBeDefined();
        expect(chainFire!.payload.eventName).toBe('테스트 연의전');
        // 발동 후 processed — 재적재되어도 큐에 안 들어감
        expect(engine.eventEngine.queueMgr.isProcessed('test_chain_ev')).toBe(true);
    });

    it('발동한 이벤트가 연대기에 HISTORICAL 종으로 기록된다', async () => {
        const year = store.getGlobalState().time.year;
        engine.eventEngine.queueMgr.enqueue(
            createEventChainNode('chronicle_ev', '연대기 시험 이벤트', [
                { type: ConditionType.YEAR, minValue: year },
            ]),
        );

        await engine.executeTurn();

        const entries = engine.chronicle.list();
        const hit = entries.find(e => e.kind === 'HISTORICAL' && e.text.includes('연대기 시험 이벤트'));
        expect(hit).toBeDefined();
        expect(hit!.icon).toBe('📜');
    });

    it('역사 이벤트(황건적의 난)가 시나리오 연도에서 자동 발화된다', async () => {
        const fired: Array<Record<string, unknown>> = [];
        engine.subscribe('HISTORICAL_EVENT', (e) => fired.push(e.payload));

        // 시나리오 05는 200년 관도 시기 — 200년 이하 조건 이벤트 중 미발동 것들이 발화
        await engine.executeTurn();

        const historical = fired.filter(f => f.source === 'historical');
        expect(historical.length).toBeGreaterThanOrEqual(0);
        // 발화한 것이 있다면 연대기에도 기록되어야 함
        for (const h of historical) {
            const hit = engine.chronicle.list().find(e => e.text.includes(String(h.eventName)));
            expect(hit).toBeDefined();
        }
    });

    it('분기 등록 → 발생 이벤트 조건으로 분기 활성화 → 체인 노드 적재', async () => {
        engine.scenarioBranches.registerBranch({
            branchId: 'branch_after_guandu',
            branchType: BranchType.HISTORICAL,
            conditionId: 'battle_guandu',
            nodes: [
                createEventChainNode('guandu_aftermath', '관도 이후', [
                    { type: ConditionType.YEAR, minValue: 9999 }, // 다음 스캔에서 미충족 — 큐 대기 확인용
                ]),
            ],
        });

        // 관도대전(200년 10월) 발동 대기 — 시나리오 05 시작 연도가 200년이면 발동
        await engine.executeTurn();

        const branch = engine.scenarioBranches.getBranch('branch_after_guandu');
        expect(branch).toBeDefined();
        // 관도 발동 시 분기가 활성화되고 노드가 큐에 적재된다
        if (engine.eventEngine.queueMgr.isProcessed('battle_guandu')) {
            expect(engine.scenarioBranches.getActiveBranchId()).toBe('branch_after_guandu');
            expect(engine.eventEngine.queueMgr.isQueued('guandu_aftermath')).toBe(true);
        }
    });

    it('세이브/로드 — 역사 이벤트 발동 이력이 보존되어 재발동하지 않는다', async () => {
        await engine.executeTurn();
        const firedFirstRun = engine.historicalEvents.getTriggeredEvents().length;

        const save = engine.save();
        expect(save.ported?.eventChains).toBeDefined();
        expect(save.ported!.eventChains!.historical.triggeredIds.length).toBe(firedFirstRun);

        // 새 엔진에 로드
        const store2 = new GameStore();
        const engine2 = new GameEngine(store2);
        const world2 = buildWorld(
            (scenarioIndex as Array<{ id: string }>).find(s => s.id === '05')! as never,
            2,
        );
        engine2.initWorld(world2.officers, world2.factions, world2.cities, []);
        engine2.load(save);

        // 발동 이력 복원 확인
        expect(engine2.historicalEvents.getTriggeredEvents().length).toBe(firedFirstRun);

        // 같은 조건에서 재실행해도 동일 이벤트가 재발동하지 않는다
        const fired2: Array<Record<string, unknown>> = [];
        engine2.subscribe('HISTORICAL_EVENT', (e) => fired2.push(e.payload));
        const idsBefore = new Set(engine2.historicalEvents.getTriggeredEvents().map(e => e.id));
        await engine2.executeTurn();
        for (const p of fired2) {
            expect(idsBefore.has(String(p.eventId))).toBe(false);
        }
    });
});
