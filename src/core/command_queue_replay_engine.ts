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

export class CommandQueueReplayEngine {
    private commands: ReplayCommand[] = [];
    private snapshots: ReplaySnapshot[] = [];
    private currentIndex = 0;
    private speed = 1.0;
    private playing = false;

    /** 커맨드 기록 */
    recordCommand(turn: number, action: string, params: Record<string, unknown>): void {
        this.commands.push({ turn, action, params, timestamp: Date.now() });
    }

    /** 스냅샷 기록 */
    recordSnapshot(turn: number, stateHash: string): void {
        this.snapshots.push({ turn, stateHash });
    }

    /** 리플레이 시작 */
    async play(
        onCommand: (cmd: ReplayCommand) => void,
        onComplete?: () => void
    ): Promise<void> {
        this.currentIndex = 0;
        this.playing = true;

        while (this.currentIndex < this.commands.length && this.playing) {
            const cmd = this.commands[this.currentIndex];
            onCommand(cmd);
            this.currentIndex++;

            // 속도에 따른 지연
            const delay = Math.max(16, Math.round(100 / this.speed));
            await this.sleep(delay);
        }

        this.playing = false;
        onComplete?.();
    }

    /** 리플레이 일시정지 */
    pause(): void {
        this.playing = false;
    }

    /** 리플레이 재개 */
    resume(): void {
        this.playing = true;
    }

    /** 특정 턴으로 Seek */
    seekToTurn(turn: number): void {
        const idx = this.commands.findIndex(c => c.turn >= turn);
        this.currentIndex = idx >= 0 ? idx : this.commands.length;
    }

    /** 재생 속도 설정 */
    setSpeed(speed: number): void {
        this.speed = Math.max(0.1, Math.min(10, speed));
    }

    /** 전체 커맨드 수 */
    getCommandCount(): number {
        return this.commands.length;
    }

    /** 현재 재생 위치 */
    getCurrentTurn(): number {
        if (this.currentIndex >= this.commands.length) return -1;
        return this.commands[this.currentIndex]?.turn ?? -1;
    }

    /** 리플레이 데이터를 JSON으로 내보내기 */
    exportToJSON(): string {
        return JSON.stringify({
            commands: this.commands,
            snapshots: this.snapshots,
        });
    }

    /** JSON에서 리플레이 데이터 가져오기 */
    importFromJSON(json: string): void {
        const data = JSON.parse(json);
        this.commands = data.commands ?? [];
        this.snapshots = data.snapshots ?? [];
        this.currentIndex = 0;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
