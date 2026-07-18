/**
 * [Task 14] 플레이어 입력 차단 및 프리징 상태 제어 (Phase Lock Manager)
 *
 * RESOLUTION 단계로 전이될 때 플레이어가 UI를 통해
 * 추가 명령을 제출할 수 없도록 강제 제어하는 Lock 인터페이스.
 */
export declare class PhaseLockManager {
    private locked;
    lock(): void;
    unlock(): void;
    checkLock(): void;
    get isLocked(): boolean;
}
//# sourceMappingURL=phase_lock_manager.d.ts.map