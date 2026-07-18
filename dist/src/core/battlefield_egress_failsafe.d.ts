/**
 * [B30] 전투 종료 클린업 핸들러 — Battlefield Egress Failsafe
 *
 * BattlefieldEgressFailsafe:
 *   1. 전장 종료(전멸/후퇴/시간초과) 시 활성화 리소스 정리
 *   2. 타이머/인터벌 일괄 해제
 *   3. 3D 오디오 노드 정적 소멸
 *   4. 시선(LOS) 처리 데이터 초기화
 *   5. 메모리 누수 방지
 */
export type BattleEndReason = 'ANNIHILATION' | 'RETREAT' | 'TIMEOUT' | 'SURRENDER';
export interface BattleCleanupResult {
    readonly reason: BattleEndReason;
    readonly timersCleared: number;
    readonly audioNodesReleased: number;
    readonly losDataCleared: number;
    readonly heapFreed: number;
}
export declare class BattlefieldEgressFailsafe {
    private activeTimers;
    private activeTimeouts;
    private losDataEntries;
    private audioNodeCount;
    registerTimer(timerId: ReturnType<typeof setInterval>): void;
    registerTimeout(timeoutId: ReturnType<typeof setTimeout>): void;
    registerLOSData(count: number): void;
    registerAudioNodes(count: number): void;
    executeCleanup(reason: BattleEndReason): BattleCleanupResult;
    getActiveTimerCount(): number;
}
//# sourceMappingURL=battlefield_egress_failsafe.d.ts.map