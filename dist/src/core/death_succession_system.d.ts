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
export declare class DeathSuccessionManager {
    private deathEvents;
    private successionEvents;
    private currentDate;
    setCurrentDate(date: number): void;
    /** 무장 사망 처리 */
    processDeath(officerId: OfficerID, factionId: FactionID, cause: DeathCause, age: number): DeathEvent;
    /** 후계자 선정 */
    selectHeir(factionId: FactionID, candidates: HeirCandidate[]): HeirCandidate | null;
    /** 후계자 승계 */
    triggerSuccession(factionId: FactionID, deceasedOfficerId: OfficerID, successorId: OfficerID, officers: {
        id: OfficerID;
        loyalty: number;
    }[], cause: DeathCause): SuccessionEvent;
    /** 자연사 확률 계산 */
    calculateNaturalDeathProbability(age: number): number;
    /** 연령별 사망 확률 롤 */
    rollNaturalDeath(age: number): boolean;
    /** 전사 확률 (HP 비례) */
    rollBattleDeath(remainingHp: number, maxHp: number): boolean;
    getDeathEvents(): DeathEvent[];
    getSuccessionEvents(): SuccessionEvent[];
    clear(): void;
}
//# sourceMappingURL=death_succession_system.d.ts.map