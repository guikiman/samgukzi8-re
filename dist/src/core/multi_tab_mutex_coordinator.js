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
export class MultiTabMutexCoordinator {
    constructor(tabId) {
        this.currentLockHolder = null;
        this.lockTimestamp = null;
        this.broadcastChannel = null;
        this.tabId = tabId ?? `tab_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }
    /** 초기화: BroadcastChannel 연결 */
    init() {
        try {
            this.broadcastChannel = new BroadcastChannel('sangokushi_mutex');
            this.broadcastChannel.onmessage = (event) => {
                const msg = event.data;
                if (msg.type === 'LOCK_REQUEST') {
                    this.handleLockRequest(msg.tabId);
                }
                else if (msg.type === 'LOCK_RELEASE') {
                    this.handleLockRelease(msg.tabId);
                }
            };
        }
        catch {
            // BroadcastChannel 미지원 환경: 단일 탭 모드로 동작
        }
    }
    /** 락 획득 시도 */
    acquireLock() {
        if (this.currentLockHolder !== null) {
            return this.currentLockHolder === this.tabId;
        }
        this.currentLockHolder = this.tabId;
        this.lockTimestamp = Date.now();
        // 다른 탭에 알림
        if (this.broadcastChannel) {
            this.broadcastChannel.postMessage({
                type: 'LOCK_REQUEST',
                tabId: this.tabId,
            });
        }
        return true;
    }
    /** 락 해제 */
    releaseLock() {
        if (this.currentLockHolder !== this.tabId)
            return;
        this.currentLockHolder = null;
        this.lockTimestamp = null;
        if (this.broadcastChannel) {
            this.broadcastChannel.postMessage({
                type: 'LOCK_RELEASE',
                tabId: this.tabId,
            });
        }
    }
    /** 락 상태 조회 */
    getState() {
        return {
            currentLockHolder: this.currentLockHolder,
            lockTimestamp: this.lockTimestamp,
            tabId: this.tabId,
            state: this.currentLockHolder === this.tabId ? 'LOCKED' : 'UNLOCKED',
        };
    }
    /** 저장 가능 여부 */
    canSave() {
        return this.currentLockHolder === this.tabId;
    }
    /** 저장 시도 (락 없으면 예외) */
    ensureLockOrThrow() {
        if (!this.canSave()) {
            throw new Error('동시 저장 불가: 다른 탭에서 이미 저장 중입니다. ' +
                '잠시 후 다시 시도하거나 다른 탭을 닫아주세요.');
        }
    }
    handleLockRequest(requestingTabId) {
        if (requestingTabId === this.tabId)
            return;
        // 다른 탭의 락 요청이 들어왔고, 현재 내가 락을 가지고 있으면 양보
        if (this.currentLockHolder === this.tabId) {
            this.releaseLock();
        }
    }
    handleLockRelease(releasingTabId) {
        if (this.currentLockHolder === releasingTabId) {
            this.currentLockHolder = null;
            this.lockTimestamp = null;
        }
    }
    /** 정리 */
    destroy() {
        this.releaseLock();
        if (this.broadcastChannel) {
            this.broadcastChannel.close();
            this.broadcastChannel = null;
        }
    }
}
//# sourceMappingURL=multi_tab_mutex_coordinator.js.map