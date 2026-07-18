/**
 * [Task 14] 플레이어 입력 차단 및 프리징 상태 제어 (Phase Lock Manager)
 *
 * RESOLUTION 단계로 전이될 때 플레이어가 UI를 통해
 * 추가 명령을 제출할 수 없도록 강제 제어하는 Lock 인터페이스.
 */
export class PhaseLockManager {
    constructor() {
        this.locked = false;
    }
    lock() {
        this.locked = true;
    }
    unlock() {
        this.locked = false;
    }
    checkLock() {
        if (this.locked) {
            throw new Error("[PhaseLock] RESOLUTION 단계에서는 명령을 제출할 수 없습니다.");
        }
    }
    get isLocked() {
        return this.locked;
    }
}
//# sourceMappingURL=phase_lock_manager.js.map