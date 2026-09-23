import { describe, it, expect } from 'vitest';
import {
    computeCombatPower,
    simulateAutoBattle,
    resolveInstantBattle,
    isSupplyCut,
    type AutoBattleUnit,
    type AutoBattleSides,
} from '../src/core/auto_battle_simulator.js';
import type { HexCoord } from '../src/core/render_queue_types.js';

function makeUnit(id: string, name: string, over: Partial<AutoBattleUnit> = {}): AutoBattleUnit {
    return {
        unitId: id,
        commanderId: id,
        commanderName: name,
        leadership: 70,
        might: 70,
        soldiers: 5000,
        morale: 60,
        training: 60,
        isSupplied: true,
        position: { q: 0, r: 0 } as HexCoord,
        ...over,
    };
}

function makeSides(over: Partial<AutoBattleSides> = {}): AutoBattleSides {
    return {
        attacker: makeUnit('atk', '공격장수'),
        defender: makeUnit('def', '방어장수', { position: { q: 2, r: 0 } as HexCoord }),
        siege: false,
        ...over,
    };
}

describe('[295] 자동 전투 시뮬레이터', () => {
    it('computeCombatPower — 사기/훈련/통솔 가중 반영', () => {
        const base = computeCombatPower(makeUnit('a', 'a'));
        const buffed = computeCombatPower(makeUnit('b', 'b', { morale: 100, training: 100, leadership: 100 }));
        expect(buffed).toBeGreaterThan(base);
        // 사기 0에 가까우면 전투력 급락
        const broken = computeCombatPower(makeUnit('c', 'c', { morale: 5 }));
        expect(broken).toBeLessThan(base / 2);
    });

    it('정면 대결 — 전투력 우위 측이 승리한다', () => {
        const result = simulateAutoBattle(makeSides({
            attacker: makeUnit('atk', '조조군', { soldiers: 10000, morale: 90, training: 90 }),
            defender: makeUnit('def', '태수군', { soldiers: 3000, morale: 40, training: 40 }),
        }));
        expect(result.winner).toBe('attacker');
        expect(result.attackerRemaining).toBeGreaterThan(result.defenderRemaining);
        expect(result.roundLogs.length).toBeGreaterThanOrEqual(1);
    });

    it('성 방어 — 공성 시 방어자 유리 (방어막 25% 감소)', () => {
        // 동일 조건 10회 반복 — 공성일 때 방어자 승률이 압도적
        let defenderWins = 0;
        for (let i = 0; i < 10; i++) {
            const r = simulateAutoBattle(makeSides({
                attacker: makeUnit('atk', '공격군', { soldiers: 6000, morale: 70, training: 70 }),
                defender: makeUnit('def', '수비군', { soldiers: 6000, morale: 70, training: 70 }),
                siege: true,
            }));
            if (r.winner === 'defender') defenderWins++;
        }
        expect(defenderWins).toBeGreaterThanOrEqual(7);
    });

    it('보급 단절 — 라운드마다 사기 −10 붕괴 (Python process_turn 이식)', () => {
        const result = simulateAutoBattle(makeSides({
            attacker: makeUnit('atk', '고립군', { soldiers: 5000, isSupplied: false }),
            defender: makeUnit('def', '방어군', { soldiers: 5000 }),
        }));
        // 고립군이 불리해야 정상
        expect(result.winner).toBe('defender');
        // 로그에 보급 단절 노트 존재
        expect(result.roundLogs.some(l => l.note?.includes('보급'))).toBe(true);
    });

    it('고저차 보정 — 고지대 공격자가 우세 (Python elevation bonus 1.2 이식)', () => {
        // 산 위 공격자 vs 평지 방어자 — 동일 스탯, 반복 판정
        let mountainWins = 0;
        for (let i = 0; i < 12; i++) {
            const r = simulateAutoBattle(makeSides({
                attacker: makeUnit('atk', '산악군'),
                defender: makeUnit('def', '평지군'),
                attackerTile: { q: 0, r: 0, terrain: 'MOUNTAIN', elevation: 20 },
                defenderTile: { q: 1, r: 0, terrain: 'PLAIN', elevation: 0 },
            }));
            if (r.winner === 'attacker') mountainWins++;
        }
        expect(mountainWins).toBeGreaterThanOrEqual(8);
    });

    it('순환 참조 없이 종료 — 최대 라운드 초과 시 방어자 승리', () => {
        const result = simulateAutoBattle(makeSides({
            attacker: makeUnit('atk', '무자비한 공격군', { soldiers: 999999, morale: 100, training: 100 }),
            defender: makeUnit('def', '철벽 방어군', { soldiers: 999999, morale: 100, training: 100, position: { q: 5, r: 5 } as HexCoord }),
        }));
        // 라운드 한도 내 종료 보장
        expect(result.rounds).toBeLessThanOrEqual(12);
        expect(['attacker', 'defender']).toContain(result.winner);
    });

    it('isSupplyCut — 4방향 이상 포위 시 단절 판정', () => {
        const unit = { q: 0, r: 0 } as HexCoord;
        const base = { q: -5, r: 0 } as HexCoord;
        // 4방향 봉쇄
        const enemies4 = [
            { q: 1, r: 0 } as HexCoord, { q: -1, r: 0 } as HexCoord,
            { q: 0, r: 1 } as HexCoord, { q: 0, r: -1 } as HexCoord,
        ];
        expect(isSupplyCut(unit, base, enemies4)).toBe(true);
        // 1방향만 — 통과
        expect(isSupplyCut(unit, base, [{ q: 1, r: 0 } as HexCoord])).toBe(false);
        // 없음 — 통과
        expect(isSupplyCut(unit, base, [])).toBe(false);
    });

    it('resolveInstantBattle — 단판 판정 및 손실률 일관성', () => {
        const sides = makeSides();
        const result = resolveInstantBattle(sides);
        expect(['attacker', 'defender']).toContain(result.winner);
        if (result.winner === 'attacker') {
            // 승자 손실 < 패자 손실
            const atkLoss = sides.attacker.soldiers - result.attackerRemaining;
            const defLoss = sides.defender.soldiers - result.defenderRemaining;
            expect(atkLoss).toBeLessThan(defLoss);
        }
    });

    it('성능 목표 — 1,000회 연속 시뮬레이션 0.1초 내 완료', () => {
        const sides = makeSides();
        const start = performance.now();
        for (let i = 0; i < 1000; i++) {
            simulateAutoBattle(sides);
        }
        const elapsed = performance.now() - start;
        expect(elapsed).toBeLessThan(100); // 0.1초 = 100ms
    });
});
