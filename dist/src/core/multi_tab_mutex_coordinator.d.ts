/**
 * [E33] 브라우저 다중 탭 데이터 락 제어기 — MultiTabMutexCoordinator
 *
 * 목적: 동일 게임 탭 여러 개 열었을 때 데이터 동시 저장으로
 *       IndexedDB 데드락 방지. SharedWorker/BroadcastChannel 기반 뮤텍스.
 *
 * 핵심 로직:
 *   1. 최초 활성화 탭에 '세이브 마스터 권한(Lock)' 부여
 *   2. 타 탭 저장 시도 → '동시 사용 불가' 예외 + 롤백
 */
export type MutexState = 'UNLOCKED' | 'LOCKED';
export interface MutexCoordinatorState {
    readonly currentLockHolder: string | null;
    readonly lockTimestamp: number | null;
    readonly tabId: string;
    readonly state: MutexState;
}
export declare class MultiTabMutexCoordinator {
    private currentLockHolder;
    private lockTimestamp;
    private readonly tabId;
    private broadcastChannel;
    constructor(tabId?: string);
    /** 초기화: BroadcastChannel 연결 */
    init(): void;
    /** 락 획득 시도 */
    acquireLock(): boolean;
    /** 락 해제 */
    releaseLock(): void;
    /** 락 상태 조회 */
    getState(): MutexCoordinatorState;
    /** 저장 가능 여부 */
    canSave(): boolean;
    /** 저장 시도 (락 없으면 예외) */
    ensureLockOrThrow(): void;
    private handleLockRequest;
    private handleLockRelease;
    /** 정리 */
    destroy(): void;
}
//# sourceMappingURL=multi_tab_mutex_coordinator.d.ts.map