import { describe, it, expect } from 'vitest';
import {
    RIOT_THRESHOLD,
    RECRUIT_RIOT_INCREMENT,
    accumulateRecruitFatigue,
    processStarvation,
    decayRiotRisk,
    checkRiot,
    DebrisField,
    DEBRIS_CONFIG,
    type CitySecurityState,
} from '../src/core/city_security_system.js';

function makeState(over: Partial<CitySecurityState> = {}): CitySecurityState {
    return { cityId: 'xuchang', riotRisk: 0, publicOrder: 60, ...over };
}

describe('[148] 민란 위험도 시스템', () => {
    it('징병 피로도 축적 — Python riot_risk += 5 이식', () => {
        const state = makeState();
        expect(accumulateRecruitFatigue(state, 300)).toBe(RECRUIT_RIOT_INCREMENT);
        expect(accumulateRecruitFatigue(state, 300)).toBe(RECRUIT_RIOT_INCREMENT * 2);
        // 소규모 징병은 무시
        const idle = makeState({ riotRisk: 10 });
        expect(accumulateRecruitFatigue(idle, 0)).toBe(10);
    });

    it('아사 판정 — 군량 0 시 병력 5% 소모 (Python soldiers // 20 이식)', () => {
        const state = makeState();
        const r = processStarvation(state, 0, 1000);
        expect(r.starveLoss).toBe(50);
        expect(r.soldiersAfter).toBe(950);
        expect(r.riotRisk).toBe(15); // 굶주림 위험도 +15
        // 군량이 있으면 무변화
        const ok = processStarvation(makeState(), 500, 1000);
        expect(ok.starveLoss).toBe(0);
        expect(ok.soldiersAfter).toBe(1000);
    });

    it('월간 위험도 자연 감소 — 치안이 높을수록 빠름', () => {
        const lowOrder = decayRiotRisk(makeState({ riotRisk: 50, publicOrder: 10 }), 10);
        const highOrder = decayRiotRisk(makeState({ riotRisk: 50, publicOrder: 100 }), 100);
        expect(lowOrder).toBe(50 - 3);       // 치안 낮음 → 기본 감소만
        expect(highOrder).toBe(50 - 3 - 4);  // 치안 높음 → 추가 감소
    });

    it('민란 판정 — 임계 도달 + 치안 미달 시 반란', () => {
        // 임계 미만 — 안전
        const below = checkRiot(makeState({ riotRisk: RIOT_THRESHOLD - 1, publicOrder: 0 }), 'wei', 0.99);
        expect(below.occurred).toBe(false);
        // 임계 도달 + 치안 0 + 억제 실패 roll → 반란
        const riot = checkRiot(makeState({ riotRisk: RIOT_THRESHOLD, publicOrder: 0 }), 'wei', 0.99);
        expect(riot.occurred).toBe(true);
        expect(riot.fromFactionId).toBe('wei');
        expect(riot.message).toContain('민란');
        // 반란 후 부분 리셋 확인
        expect(makeState({ riotRisk: RIOT_THRESHOLD, publicOrder: 0 }).riotRisk).toBe(RIOT_THRESHOLD);
    });

    it('높은 치안은 임계 도달해도 억제한다', () => {
        const suppressed = checkRiot(makeState({ riotRisk: RIOT_THRESHOLD, publicOrder: 100 }), 'wei', 0.1);
        expect(suppressed.occurred).toBe(false);
        // 억제 시 위험도 일부 소각
        expect(suppressed.message).toBeDefined();
    });
});

describe('[401][408] 잔해 ZOC 시스템', () => {
    it('잔해 생성 — 중심 + 1반경 7타일 생성', () => {
        const field = new DebrisField();
        const created = field.createDebris({ q: 3, r: -2 }, 10);
        expect(created).toHaveLength(7);
        expect(field.hasDebris(3, -2)).toBe(true);
        expect(field.hasDebris(4, -2)).toBe(true);
        expect(field.size).toBe(7);
    });

    it('이동 비용 배율 — 잔해 2.0, 일반 1.0', () => {
        const field = new DebrisField();
        field.createDebris({ q: 0, r: 0 }, 1);
        expect(field.getMoveCostMultiplier(0, 0)).toBe(DEBRIS_CONFIG.MOVE_COST);
        expect(field.getMoveCostMultiplier(5, 5)).toBe(1.0);
    });

    it('잔해 ZOC — 인접 헥스가 제약 경계에 포함된다', () => {
        const field = new DebrisField();
        field.createDebris({ q: 0, r: 0 }, 1);
        expect(field.isInDebrisZoc(0, 0)).toBe(true);   // 잔해 본체
        expect(field.isInDebrisZoc(1, 0)).toBe(true);   // 인접
        expect(field.isInDebrisZoc(3, 3)).toBe(false);  // 원거리
        // ZOC 키 집합에 인접 헥스 포함
        const zoc = field.getDebrisZocKeys();
        expect(zoc.has('2,0')).toBe(true);
        expect(zoc.has('0,2')).toBe(true);
    });

    it('수명 종료 잔해 자동 소거 [408]', () => {
        const field = new DebrisField();
        field.createDebris({ q: 0, r: 0 }, 1);
        // 2턴 후 — 아직 유지
        expect(field.cleanupExpired(2)).toBe(0);
        expect(field.size).toBe(7);
        // 4턴 후 — 전부 소거 (1 + 3수명)
        expect(field.cleanupExpired(4)).toBe(7);
        expect(field.size).toBe(0);
    });

    it('중복 생성 방지 및 세이브/로드', () => {
        const field = new DebrisField();
        field.createDebris({ q: 0, r: 0 }, 1);
        const again = field.createDebris({ q: 0, r: 0 }, 2);
        expect(again).toHaveLength(0); // 기존 타일 유지

        const snap = field.serialize();
        const restored = new DebrisField();
        restored.restore(snap);
        expect(restored.size).toBe(7);
        expect(restored.hasDebris(0, 0)).toBe(true);
    });
});
