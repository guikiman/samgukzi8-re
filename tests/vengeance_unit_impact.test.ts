import { describe, it, expect } from 'vitest';
import {
    applyVengeanceToUnits,
    VENGEANCE_ALLY_MORALE_BOOST,
    VENGEANCE_ATTACK_BONUS,
    VENGEANCE_FAIL_ALLY_MORALE_HIT,
    VENGEANCE_MORALE_HIT,
    type VengeanceUnit,
} from '../src/core/vengeance_system.js';
import type { VengeanceOutcome } from '../src/core/vengeance_system.js';

function makeOutcome(success: boolean): VengeanceOutcome {
    return {
        triggered: true,
        kind: 'DUEL',
        actorId: 'actor_1',
        targetId: 'target_1',
        success,
        affinityDelta: success ? 40 : -15,
        targetMoraleHit: success ? VENGEANCE_MORALE_HIT : 0,
        message: '',
    };
}

function makeUnits(): { allies: VengeanceUnit[]; enemies: VengeanceUnit[] } {
    return {
        allies: [
            { unitId: 'a1', officerId: 'actor_1', morale: 80, baseAttack: 70 },
            { unitId: 'a2', officerId: 'ally_2', morale: 80, baseAttack: 60 },
        ],
        enemies: [
            { unitId: 'e1', officerId: 'target_1', morale: 75, baseAttack: 65 },
            { unitId: 'e2', officerId: 'enemy_2', morale: 75, baseAttack: 55 },
        ],
    };
}

describe('복수 → 전투 유닛 임팩트 [32][131-145]', () => {
    it('성공 시 적군 사기 감소', () => {
        const { allies, enemies } = makeUnits();
        const impact = applyVengeanceToUnits(makeOutcome(true), allies, enemies);
        const hit = Math.floor(VENGEANCE_MORALE_HIT / 3);
        expect(enemies[0].morale).toBe(75 - hit);
        expect(enemies[1].morale).toBe(75 - hit);
        expect(impact.enemyLog).toContain('적군 사기');
    });

    it('성공 시 아군 전체 사기 상승', () => {
        const { allies, enemies } = makeUnits();
        applyVengeanceToUnits(makeOutcome(true), allies, enemies);
        expect(allies[0].morale).toBe(80 + VENGEANCE_ALLY_MORALE_BOOST);
        expect(allies[1].morale).toBe(80 + VENGEANCE_ALLY_MORALE_BOOST);
        expect(impact_alliesHasBoost(allies)).toBe(true);
    });

    it('성공 시 주도자 유닛에 공격 보정', () => {
        const { allies, enemies } = makeUnits();
        applyVengeanceToUnits(makeOutcome(true), allies, enemies);
        const actorUnit = allies.find(u => u.officerId === 'actor_1')!;
        expect(actorUnit.baseAttack).toBe(70 + VENGEANCE_ATTACK_BONUS);
        // 적 유닛은 보정 없음
        expect(enemies[0].baseAttack).toBe(65);
    });

    it('실패 시 주도자 아군 사기 감소, 적군은 무관', () => {
        const { allies, enemies } = makeUnits();
        const impact = applyVengeanceToUnits(makeOutcome(false), allies, enemies);
        expect(allies[0].morale).toBe(80 - VENGEANCE_FAIL_ALLY_MORALE_HIT);
        expect(enemies[0].morale).toBe(75);
        expect(impact.allyLog).toContain('복수 실패');
        expect(impact.enemyLog).toBeNull();
    });

    it('사기는 100 상한 / 10 하한 클램프', () => {
        const outcome = makeOutcome(true);
        const allies: VengeanceUnit[] = [{ unitId: 'a1', officerId: 'actor_1', morale: 97, baseAttack: 70 }];
        const enemies: VengeanceUnit[] = [{ unitId: 'e1', officerId: 'target_1', morale: 12, baseAttack: 65 }];
        applyVengeanceToUnits(outcome, allies, enemies);
        expect(allies[0].morale).toBe(100);
        expect(enemies[0].morale).toBe(10);
    });

    it('발동하지 않은 결과는 무변경', () => {
        const { allies, enemies } = makeUnits();
        const notTriggered: VengeanceOutcome = {
            triggered: false, kind: null, actorId: null, targetId: null,
            success: false, affinityDelta: 0, targetMoraleHit: 0, message: '',
        };
        const impact = applyVengeanceToUnits(notTriggered, allies, enemies);
        expect(allies[0].morale).toBe(80);
        expect(enemies[0].morale).toBe(75);
        expect(impact.allyLog).toBeNull();
        expect(impact.enemyLog).toBeNull();
    });
});

function impact_alliesHasBoost(allies: VengeanceUnit[]): boolean {
    return allies.every(u => u.morale >= 80);
}
