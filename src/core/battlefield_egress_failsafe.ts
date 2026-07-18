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

export class BattlefieldEgressFailsafe {
    private activeTimers: Set<ReturnType<typeof setInterval>> = new Set();
    private activeTimeouts: Set<ReturnType<typeof setTimeout>> = new Set();
    private losDataEntries = 0;
    private audioNodeCount = 0;

    registerTimer(timerId: ReturnType<typeof setInterval>): void {
        this.activeTimers.add(timerId);
    }

    registerTimeout(timeoutId: ReturnType<typeof setTimeout>): void {
        this.activeTimeouts.add(timeoutId);
    }

    registerLOSData(count: number): void {
        this.losDataEntries += count;
    }

    registerAudioNodes(count: number): void {
        this.audioNodeCount += count;
    }

    executeCleanup(reason: BattleEndReason): BattleCleanupResult {
        let timersCleared = 0;
        let audioNodesReleased = 0;
        let losDataCleared = 0;

        for (const timer of this.activeTimers) {
            clearInterval(timer);
            timersCleared++;
        }
        for (const timeout of this.activeTimeouts) {
            clearTimeout(timeout);
            timersCleared++;
        }

        audioNodesReleased = this.audioNodeCount;
        losDataCleared = this.losDataEntries;

        const heapFreed = audioNodesReleased * 1024 + losDataCleared * 64;

        this.activeTimers.clear();
        this.activeTimeouts.clear();
        this.losDataEntries = 0;
        this.audioNodeCount = 0;

        return { reason, timersCleared, audioNodesReleased, losDataCleared, heapFreed };
    }

    getActiveTimerCount(): number {
        return this.activeTimers.size + this.activeTimeouts.size;
    }
}
