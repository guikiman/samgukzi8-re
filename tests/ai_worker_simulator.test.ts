import { describe, it, expect } from 'vitest';
import {
    calculateOfficerDecision, runAITurn,
    type OfficerSnapshot, type CitySnapshot, type FactionSnapshot, type AITurnPayload,
} from '../src/ai/ai_worker_simulator';

// ============================================================
// 픽스처
// ============================================================

function makeOfficer(overrides: Partial<OfficerSnapshot> = {}): OfficerSnapshot {
    return {
        id: 'off_1', name: '테스트 무장', factionId: 'f1', cityId: 'c1',
        ambition: 60, loyalty: 70, morality: 50, infamy: 0,
        stats: { leadership: 70, might: 60, intelligence: 50, politics: 40, charisma: 55 },
        isPlayer: false,
        ...overrides,
    };
}

function makeCity(overrides: Partial<CitySnapshot> = {}): CitySnapshot {
    return {
        id: 'c1', name: '허창', ownerId: 'f1', defense: 80, population: 100_000,
        funds: 5_000, foodStores: 8_000, development: 70, maxTroops: 1_000,
        ...overrides,
    };
}

function makeFaction(overrides: Partial<FactionSnapshot> = {}): FactionSnapshot {
    return {
        id: 'f1', name: '조조군', leaderId: 'off_cao', temperament: 'HEGEMON',
        gold: 10_000, food: 20_000, cityCount: 3,
        atWarWith: ['f2'], alliedWith: [],
        ...overrides,
    };
}

function makePayload(overrides: Partial<AITurnPayload> = {}): AITurnPayload {
    return {
        year: 200, month: 1, turn: 1,
        factions: { f1: makeFaction(), f2: makeFaction({ id: 'f2', name: '원소군', leaderId: 'off_yuan', temperament: 'KINGLY' }) },
        cities: { c1: makeCity(), c2: makeCity({ id: 'c2', name: '업', ownerId: 'f2', defense: 30 }) },
        officers: [makeOfficer()],
        ...overrides,
    };
}

// ============================================================
// 개별 의사결정 로직
// ============================================================

describe('calculateOfficerDecision', () => {
    const cities = { c1: makeCity(), c2: makeCity({ id: 'c2', ownerId: 'f2', defense: 30 }) };
    const factions = { f1: makeFaction() };

    it('플레이어 소속 무장은 AI 결정을 내리지 않는다', () => {
        const d = calculateOfficerDecision(makeOfficer({ isPlayer: true }), cities, factions);
        expect(d).toBeNull();
    });

    it('충성도 붕괴 무장은 하야 검토(REST 최우선)를 선택한다', () => {
        const d = calculateOfficerDecision(makeOfficer({ loyalty: 20, ambition: 80 }), cities, factions);
        expect(d).not.toBeNull();
        expect(d!.actionType).toBe('REST');
        expect(d!.priority).toBe(0.99);
        expect(d!.reasoning).toContain('하야');
    });

    it('공격 성향 + 병량 충분 + 전쟁 중이면 최약 적성 도시 공격을 선택한다', () => {
        // ambition 90 × leadership 80 → aggression 0.86 > 0.62
        const d = calculateOfficerDecision(
            makeOfficer({ ambition: 90, loyalty: 80, stats: { leadership: 80, might: 70, intelligence: 60, politics: 50, charisma: 60 } }),
            cities, factions,
        );
        expect(d).not.toBeNull();
        expect(d!.actionType).toBe('BATTLE');
        expect(d!.payload['targetCityId']).toBe('c2'); // f2의 최약 도시
    });

    it('전쟁 중이 아니면 공격하지 않는다', () => {
        const peaceful = { f1: makeFaction({ atWarWith: [] }) };
        const d = calculateOfficerDecision(
            makeOfficer({ ambition: 90, loyalty: 80 }),
            cities, peaceful,
        );
        expect(d!.actionType).not.toBe('BATTLE');
    });

    it('병량 위기 도시에서는 내정(개간)을 최우선한다', () => {
        const famine = { c1: makeCity({ foodStores: 100 }), c2: makeCity({ id: 'c2', ownerId: 'f2' }) };
        const poorFaction = { f1: makeFaction({ food: 300, atWarWith: [] }) };
        const d = calculateOfficerDecision(makeOfficer({ loyalty: 80 }), famine, poorFaction);
        expect(d!.actionType).toBe('DOMESTIC');
        expect(d!.reasoning).toContain('병량 위기');
    });

    it('패도(HEGEMON) 성향은 의리(RIGHTEOUS) 성향보다 징병 우선순위가 높다', () => {
        // 방어도 60: 패도 임계치(60×1.4=84) 미만 → 징병, 의리 임계치(60×0.8=48) 이상 → 내정
        const lowDefCity = { c1: makeCity({ defense: 60, foodStores: 8_000 }), c2: makeCity({ id: 'c2', ownerId: 'f2' }) };
        const noWar = { atWarWith: [] };

        const hegemon = calculateOfficerDecision(
            makeOfficer({ loyalty: 80, stats: { leadership: 70, might: 60, intelligence: 50, politics: 40, charisma: 55 } }),
            lowDefCity, { f1: makeFaction({ temperament: 'HEGEMON', ...noWar }) },
        );
        const righteous = calculateOfficerDecision(
            makeOfficer({ loyalty: 80, stats: { leadership: 70, might: 60, intelligence: 50, politics: 40, charisma: 55 } }),
            lowDefCity, { f1: makeFaction({ temperament: 'RIGHTEOUS', ...noWar }) },
        );

        // 패도는 징병을 선택하고, 의리 성향은 내정을 선택하는 구조 차이 확인
        expect(hegemon!.actionType).toBe('RECRUITMENT');
        expect(righteous!.actionType).toBe('DOMESTIC');
    });

    it('모든 priority는 0~1 범위로 clamp 된다', () => {
        const d = calculateOfficerDecision(makeOfficer({ loyalty: 80 }), cities, factions);
        expect(d!.priority).toBeGreaterThanOrEqual(0);
        expect(d!.priority).toBeLessThanOrEqual(1);
    });
});

// ============================================================
// 세력 단위 스트리밍 배치
// ============================================================

describe('runAITurn', () => {
    it('세력별로 결정을 분할하여 스트리밍 콜백을 호출한다', async () => {
        const payload = makePayload({
            officers: [
                makeOfficer({ id: 'a1', factionId: 'f1' }),
                makeOfficer({ id: 'a2', factionId: 'f1' }),
                makeOfficer({ id: 'b1', factionId: 'f2' }),
                makeOfficer({ id: 'x1', factionId: null }), // 재야
                makeOfficer({ id: 'p1', factionId: 'f1', isPlayer: true }), // 플레이어 제외
            ],
        });

        const batches: Array<{ factionId: string; count: number }> = [];
        const summary = await runAITurn(payload, (batch) => {
            batches.push({ factionId: batch.factionId, count: batch.decisions.length });
        }, 0);

        // f1(플레이어 제외 2명), f2(1명), __FREE__(1명) 순서로 배치 전송
        expect(batches.map(b => b.factionId)).toEqual(['f1', 'f2', '__FREE__']);
        expect(batches.map(b => b.count)).toEqual([2, 1, 1]);
        expect(summary.totalDecisions).toBe(4);
        expect(summary.elapsedMs).toBeGreaterThanOrEqual(0);
    });

    it('1,000명 규모도 1초 이내에 처리한다 (성능 벤치마크)', async () => {
        const officers: OfficerSnapshot[] = [];
        for (let i = 0; i < 1000; i++) {
            officers.push(makeOfficer({
                id: `o${i}`, factionId: i % 2 === 0 ? 'f1' : 'f2',
                cityId: i % 2 === 0 ? 'c1' : 'c2',
            }));
        }
        const payload = makePayload({ officers });

        const summary = await runAITurn(payload, () => { /* no-op */ }, 0);
        expect(summary.totalDecisions).toBe(1000);
        expect(summary.elapsedMs).toBeLessThan(1000);
    });
});
