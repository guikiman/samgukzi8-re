/**
 * [Task 16] 명령 제출 타임아웃 워치독
 *
 * 플레이어의 미입력 상태가 장시간 유지되거나 AI 서브 쓰레드가
 * 중단될 경우 디폴트 '대기(Wait)' 명령을 강제 주입.
 */
export type CommandSubmission = "player_ready" | "ai_ready" | "wait" | "timeout";
export declare class CommandTimeoutWatchdog {
    private submitted;
    private timeoutMs;
    private timerId;
    private onTimeout;
    constructor(timeoutMs?: number);
    registerFaction(factionId: string): void;
    markSubmitted(factionId: string): void;
    isAllSubmitted(factionIds: string[]): boolean;
    reset(factionIds: string[]): void;
    start(callback: () => void): void;
    cancel(): void;
}
//# sourceMappingURL=command_timeout_watchdog.d.ts.map