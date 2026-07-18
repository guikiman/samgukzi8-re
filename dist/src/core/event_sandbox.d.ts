/**
 * [21] 이벤트 전용 격리 Sandbox 메모리 — EventSandbox
 *
 * EventSandbox:
 *   1. 이벤트 실행 도중 예기치 못한 에러가 발생해도 전체 게임 루프가 깨지지 않음
 *   2. 이벤트만 안전하게 취소 및 롤백
 *   3. 실행 전 상태 스냅샷 저장, 실패 시 복원
 */
import type { GameEvent } from './event_trigger_registry.js';
export interface SandboxSnapshot {
    readonly eventId: string;
    readonly timestamp: number;
    readonly capturedState: string;
}
export interface SandboxResult {
    readonly eventId: string;
    readonly success: boolean;
    readonly error: Error | null;
    readonly executionTimeMs: number;
    readonly rolledBack: boolean;
}
export type StateCaptureFn = () => string;
export type StateRestoreFn = (snapshot: string) => void;
export declare class EventSandbox {
    private snapshots;
    private captureState;
    private restoreState;
    constructor(captureState: StateCaptureFn, restoreState: StateRestoreFn);
    executeSafe(event: GameEvent): Promise<SandboxResult>;
    getSnapshot(eventId: string): SandboxSnapshot | undefined;
    clear(): void;
}
//# sourceMappingURL=event_sandbox.d.ts.map