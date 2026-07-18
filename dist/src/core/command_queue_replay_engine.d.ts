/**
 * [E49] 커맨드 큐 리플레이 엔진 — CommandQueueReplayEngine
 *
 * 목적: 저장된 Command Queue를 처음부터 끝까지 재생하여
 *       전투 리플레이 기능 구현.
 *
 * 핵심 로직:
 *   1. 저장된 Command 배열을 순차 실행
 *   2. 각 프레임 스냅샷 저장으로 Seek 기능 지원
 */
export interface ReplayCommand {
    readonly turn: number;
    readonly action: string;
    readonly params: Record<string, unknown>;
    readonly timestamp: number;
}
export interface ReplaySnapshot {
    readonly turn: number;
    readonly stateHash: string;
}
export declare class CommandQueueReplayEngine {
    private commands;
    private snapshots;
    private currentIndex;
    private speed;
    private playing;
    /** 커맨드 기록 */
    recordCommand(turn: number, action: string, params: Record<string, unknown>): void;
    /** 스냅샷 기록 */
    recordSnapshot(turn: number, stateHash: string): void;
    /** 리플레이 시작 */
    play(onCommand: (cmd: ReplayCommand) => void, onComplete?: () => void): Promise<void>;
    /** 리플레이 일시정지 */
    pause(): void;
    /** 리플레이 재개 */
    resume(): void;
    /** 특정 턴으로 Seek */
    seekToTurn(turn: number): void;
    /** 재생 속도 설정 */
    setSpeed(speed: number): void;
    /** 전체 커맨드 수 */
    getCommandCount(): number;
    /** 현재 재생 위치 */
    getCurrentTurn(): number;
    /** 리플레이 데이터를 JSON으로 내보내기 */
    exportToJSON(): string;
    /** JSON에서 리플레이 데이터 가져오기 */
    importFromJSON(json: string): void;
    private sleep;
}
//# sourceMappingURL=command_queue_replay_engine.d.ts.map