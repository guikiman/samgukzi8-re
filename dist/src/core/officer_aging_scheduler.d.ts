/**
 * [12] 무장 수명 및 자연사(Aging) 트리거 스케줄러 — OfficerAgingScheduler
 *
 * OfficerAgingScheduler:
 *   1. 매년 첫 턴 시작 시 무장의 나이를 1 증가
 *   2. 역사적 수명(deathYear)에 도달했을 때 사망 이벤트 호출
 *   3. 병(illness) 상태일 때 추가 사망 확률 롤
 *   4. 자연사 확률 = DeathSuccessionManager의 확률 테이블 활용
 *   5. 사망 이벤트 발생 시 DeathSuccessionManager로 위임
 */
import type { Officer, OfficerID } from './types.js';
import { DeathSuccessionManager, type DeathCause, type DeathEvent } from './death_succession_system.js';
export interface AgingEvent {
    readonly officerId: OfficerID;
    readonly name: string;
    readonly previousAge: number;
    readonly newAge: number;
    readonly year: number;
    readonly isBirthday: boolean;
}
export interface DeathTriggerEvent {
    readonly officerId: OfficerID;
    readonly name: string;
    readonly age: number;
    readonly cause: DeathCause;
    readonly year: number;
    readonly deathEvent: DeathEvent;
}
export interface AgingSchedulerState {
    readonly currentYear: number;
    readonly agedOfficers: AgingEvent[];
    readonly deathEvents: DeathTriggerEvent[];
    readonly totalAged: number;
    readonly totalDeaths: number;
}
export interface AgingSchedulerResult {
    readonly agingEvents: AgingEvent[];
    readonly deathEvents: DeathTriggerEvent[];
    readonly totalAged: number;
    readonly totalDeaths: number;
}
export declare class OfficerAgingScheduler {
    private deathManager;
    private currentYear;
    private agedOfficers;
    private deathTriggers;
    constructor(deathManager: DeathSuccessionManager);
    /**
     * 매년 첫 턴에 호출되어 모든 무장의 나이를 1 증가시키고
     * 사망 조건을 검사한다.
     * @param officers 전체 무장 목록
     * @param currentYear 현재 게임 년도
     * @returns 에이징 및 사망 이벤트 결과
     */
    processAnnualAging(officers: Officer[], currentYear: number): AgingSchedulerResult;
    /**
     * 현재 게임 년도를 설정한다.
     */
    setCurrentYear(year: number): void;
    /**
     * 현재 년도를 반환한다.
     */
    getCurrentYear(): number;
    /**
     * 특정 무장의 현재 나이를 계산한다.
     */
    calculateAge(officer: Officer, currentYear: number): number;
    /**
     * 사망 트리거 이력을 반환한다.
     */
    getDeathTriggers(): DeathTriggerEvent[];
    /**
     * 에이징 이력을 반환한다.
     */
    getAgingEvents(): AgingEvent[];
    /**
     * 상태를 초기화한다.
     */
    clear(): void;
}
//# sourceMappingURL=officer_aging_scheduler.d.ts.map