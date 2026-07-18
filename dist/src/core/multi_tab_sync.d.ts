/**
 * [E42] 멀티탭 동기화 — SharedWorker 기반 탭 간 상태 일관성 유지
 *
 * MultiTabSyncWorker:
 *   1. SharedWorker로 메인 세션 데이터 공유
 *   2. Lock/Unlock 메커니즘 (한 탭만 쓰기 가능)
 *   3. 변경 시 다른 탭에 브로드캐스트
 *   4. 탭 종료 시 자동 Lock 해제
 */
export interface TabSession {
    readonly tabId: string;
    readonly connectedAt: number;
    readonly lastHeartbeat: number;
}
export interface TabSyncMessage {
    readonly type: 'LOCK_ACQUIRE' | 'LOCK_RELEASE' | 'STATE_UPDATE' | 'HEARTBEAT' | 'TAB_DISCONNECTED';
    readonly tabId: string;
    readonly payload?: string;
    readonly timestamp: number;
}
export interface SyncState {
    readonly activeTabId: string | null;
    readonly sessions: TabSession[];
    readonly lastUpdate: number;
}
export declare class MultiTabSyncManager {
    private worker;
    private tabId;
    private listeners;
    private _isMaster;
    private heartbeatInterval;
    private lockTimer;
    constructor();
    get isMaster(): boolean;
    get currentTabId(): string;
    init(): boolean;
    private handleMessage;
    acquireLock(): void;
    releaseLock(): void;
    broadcastState(payload: string): void;
    private postMessage;
    private startHeartbeat;
    on(event: string, callback: (data: any) => void): void;
    off(event: string, callback: (data: any) => void): void;
    private emit;
    destroy(): void;
}
//# sourceMappingURL=multi_tab_sync.d.ts.map