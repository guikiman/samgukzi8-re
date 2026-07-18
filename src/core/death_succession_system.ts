/**
 * [C30] 사망/후계자 선정 시스템 — Death & Succession System
 *
 * DeathSuccessionManager:
 *   - processDeath(): 무장 사망 처리 (자연사/전사/암살)
 *   - selectHeir(): 후계자 선정 (적장자 > 서자 > 동생 > 고관)
 *   - triggerSuccession(): 후계자 승계 (충성도 동적 변동)
 *   - 자연사 확률 = age/1000 (매년)
 */

import type { OfficerID, FactionID } from './types';

export type DeathCause = 'NATURAL' | 'BATTLE' | 'ASSASSINATION' | 'ILLNESS' | 'OLD_AGE';

export interface DeathEvent {
    readonly officerId: OfficerID;
    readonly factionId: FactionID;
    readonly cause: DeathCause;
    readonly date: number;
    readonly age: number;
}

export interface SuccessionEvent {
    readonly factionId: FactionID;
    readonly deceasedOfficerId: OfficerID;
    readonly successorId: OfficerID;
    readonly date: number;
    readonly cause: DeathCause;
    readonly loyaltyShifts: Map<OfficerID, number>;
}

export interface HeirCandidate {
    readonly officerId: OfficerID;
    readonly relation: 'SON' | 'DAUGHTER' | 'SIBLING' | 'SPOUSE' | 'ADOPTED' | 'OFFICER' | 'RELATIVE';
    readonly priority: number;
}

export class DeathSuccessionManager {
    private deathEvents: DeathEvent[] = [];
    private successionEvents: SuccessionEvent[] = [];
    private currentDate: number = 184;

    setCurrentDate(date: number): void {
        this.currentDate = date;
    }

    /** 무장 사망 처리 */
    processDeath(officerId: OfficerID, factionId: FactionID, cause: DeathCause, age: number): DeathEvent {
        const event: DeathEvent = { officerId, factionId, cause, date: this.currentDate, age };
        this.deathEvents.push(event);
        return event;
    }

    /** 후계자 선정 */
    selectHeir(factionId: FactionID, candidates: HeirCandidate[]): HeirCandidate | null {
        if (candidates.length === 0) return null;

        // 우선순위 정렬 (낮은 숫자가 높은 우선순위)
        const sorted = [...candidates].sort((a, b) => a.priority - b.priority);
        return sorted[0];
    }

    /** 후계자 승계 */
    triggerSuccession(
        factionId: FactionID,
        deceasedOfficerId: OfficerID,
        successorId: OfficerID,
        officers: { id: OfficerID; loyalty: number }[],
        cause: DeathCause,
    ): SuccessionEvent {
        const shifts = new Map<OfficerID, number>();

        for (const officer of officers) {
            let shift = 0;
            if (officer.id === successorId) {
                shift = 20; // 후계자는 충성도 상승
            } else if (officer.loyalty > 80) {
                shift = -10; // 충성도 높던 자는 실망
            } else if (officer.loyalty > 50) {
                shift = -20; // 중립은 크게 하락
            } else {
                shift = -30; // 낮은 충성도는 반란 가능성
            }
            shifts.set(officer.id, shift);
        }

        const event: SuccessionEvent = {
            factionId, deceasedOfficerId, successorId,
            date: this.currentDate, cause, loyaltyShifts: shifts,
        };
        this.successionEvents.push(event);
        return event;
    }

    /** 자연사 확률 계산 */
    calculateNaturalDeathProbability(age: number): number {
        if (age < 20) return 0.001;
        if (age < 40) return age / 10000;
        if (age < 60) return age / 5000;
        if (age < 80) return age / 2000;
        return age / 800; // 80세 이상: 급증
    }

    /** 연령별 사망 확률 롤 */
    rollNaturalDeath(age: number): boolean {
        const probability = this.calculateNaturalDeathProbability(age);
        return Math.random() < probability;
    }

    /** 전사 확률 (HP 비례) */
    rollBattleDeath(remainingHp: number, maxHp: number): boolean {
        const hpRatio = remainingHp / Math.max(1, maxHp);
        // HP 0 = 50% 전사, HP 50% = 10% 전사
        const deathChance = 0.5 * (1 - hpRatio);
        return Math.random() < deathChance;
    }

    getDeathEvents(): DeathEvent[] {
        return [...this.deathEvents];
    }

    getSuccessionEvents(): SuccessionEvent[] {
        return [...this.successionEvents];
    }

    clear(): void {
        this.deathEvents = [];
        this.successionEvents = [];
    }
}
