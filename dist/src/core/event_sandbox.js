/**
 * [21] 이벤트 전용 격리 Sandbox 메모리 — EventSandbox
 *
 * EventSandbox:
 *   1. 이벤트 실행 도중 예기치 못한 에러가 발생해도 전체 게임 루프가 깨지지 않음
 *   2. 이벤트만 안전하게 취소 및 롤백
 *   3. 실행 전 상태 스냅샷 저장, 실패 시 복원
 */
export class EventSandbox {
    constructor(captureState, restoreState) {
        this.snapshots = new Map();
        this.captureState = captureState;
        this.restoreState = restoreState;
    }
    async executeSafe(event) {
        const start = performance.now();
        // 1. 상태 스냅샷 저장
        const snapshot = {
            eventId: event.id,
            timestamp: Date.now(),
            capturedState: this.captureState(),
        };
        this.snapshots.set(event.id, snapshot);
        // 2. 조건 평가
        try {
            const conditionMet = event.condition();
            if (!conditionMet) {
                this.snapshots.delete(event.id);
                return {
                    eventId: event.id,
                    success: false,
                    error: null,
                    executionTimeMs: performance.now() - start,
                    rolledBack: false,
                };
            }
        }
        catch (err) {
            this.restoreState(snapshot.capturedState);
            this.snapshots.delete(event.id);
            return {
                eventId: event.id,
                success: false,
                error: err instanceof Error ? err : new Error(String(err)),
                executionTimeMs: performance.now() - start,
                rolledBack: true,
            };
        }
        // 3. 액션 실행
        try {
            const result = event.action();
            if (result instanceof Promise) {
                await result.catch(err => { throw err; });
            }
            this.snapshots.delete(event.id);
            return {
                eventId: event.id,
                success: true,
                error: null,
                executionTimeMs: performance.now() - start,
                rolledBack: false,
            };
        }
        catch (err) {
            this.restoreState(snapshot.capturedState);
            this.snapshots.delete(event.id);
            return {
                eventId: event.id,
                success: false,
                error: err instanceof Error ? err : new Error(String(err)),
                executionTimeMs: performance.now() - start,
                rolledBack: true,
            };
        }
    }
    getSnapshot(eventId) {
        return this.snapshots.get(eventId);
    }
    clear() {
        this.snapshots.clear();
    }
}
//# sourceMappingURL=event_sandbox.js.map