/**
 * [15] 비정상 턴 고착(데드락) 탐지 및 자가 복구 워치독 — DeadlockWatchdog
 *
 * DeadlockWatchdog:
 *   1. 무장 AI 연산 지연 등으로 턴이 3초 이상 넘어가지 않을 경우 감지
 *   2. 해당 무장의 행동을 '휴식(REST)'으로 강제 전환
 *   3. 턴을 안전하게 스킵하고 다음 무장으로 진행
 *   4. 데드락 발생 이력 추적 및 복구 로그 기록
 *   5. 연속 데드락 발생 시 강제 턴 종료 트리거
 */
import type { OfficerID } from './types.js';
export interface WatchdogConfig {
    readonly stallTimeoutMs: number;
    readonly maxConsecutiveStalls: number;
    readonly checkIntervalMs: number;
}
export interface StallRecord {
    readonly officerId: OfficerID;
    readonly stalledSince: number;
    readonly stallDurationMs: number;
    readonly resolvedBy: 'TIMEOUT' | 'OFFICER_COMPLETED' | 'FORCE_SKIP';
}
export interface DeadlockEvent {
    readonly timestamp: number;
    readonly stalledOfficers: OfficerID[];
    readonly totalStalls: number;
    readonly forceEndTurn: boolean;
}
export type OfficerRestAction = (officerId: OfficerID) => void;
export type ForceEndTurnAction = () => void;
export type StallCheckCallback = (officerId: OfficerID) => boolean;
export declare class DeadlockWatchdog {
    private config;
    private activeTimers;
    private stallHistory;
    private consecutiveStalls;
    private isArmed;
    private watchInterval;
    private deadlockEvents;
    private restOfficer;
    private forceEndTurn;
    private isOfficerStalled;
    constructor(restOfficer: OfficerRestAction, forceEndTurn: ForceEndTurnAction, isOfficerStalled: StallCheckCallback, config?: Partial<WatchdogConfig>);
    /**
     * 특정 무장의 타이머를 시작한다.
     * 무장이 행동을 시작할 때 호출되어 데드락 감시 시작.
     */
    watch(officerId: OfficerID): void;
    /**
     * 특정 무장의 타이머를 중지한다.
     * 무장이 행동을 완료했을 때 호출.
     */
    stopWatching(officerId: OfficerID): void;
    /**
     * 워치독을 활성화한다.
     */
    arm(): void;
    /**
     * 워치독을 비활성화한다.
     */
    disarm(): void;
    /**
     * 데드락 상태를 점검하고 필요한 경우 복구 조치를 취한다.
     */
    private checkForDeadlocks;
    /**
     * 현재 감시 중인 무장 목록을 반환한다.
     */
    getWatchedOfficers(): OfficerID[];
    /**
     * 데드락 이력을 반환한다.
     */
    getStallHistory(): StallRecord[];
    /**
     * 데드락 이벤트 목록을 반환한다.
     */
    getDeadlockEvents(): DeadlockEvent[];
    /**
     * 현재 연속 데드락 횟수를 반환한다.
     */
    getConsecutiveStalls(): number;
    /**
     * 워치독이 현재 활성 상태인지 반환한다.
     */
    isActive(): boolean;
    /**
     * 설정을 업데이트한다.
     */
    updateConfig(config: Partial<WatchdogConfig>): void;
    /**
     * 상태를 초기화한다.
     */
    clear(): void;
}
//# sourceMappingURL=deadlock_watchdog.d.ts.map