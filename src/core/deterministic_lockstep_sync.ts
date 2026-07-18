/**
 * [E42] 난수 동화형 멀티플레이어 동기화기 — DeterministicLockstepSync
 *
 * 목적: 네트워크 상에서 탭 간 동일 난수 상태로 완전히 동일한 연산 결과 보장.
 *
 * 핵심 로직:
 *   1. Math.random 배제, Seed 기반 PRNG(LCG) 사용
 *   2. 입력 Command Queue 동기화
 */

export interface LockstepFrame {
    readonly turn: number;
    readonly commands: string[];
    readonly checksum: string;
}

export interface SyncState {
    readonly seed: number;
    readonly turn: number;
    readonly prngCallCount: number;
}

/** LCG(Linear Congruential Generator) — 결정론적 난수 */
export class PRNG {
    private state: number;

    constructor(seed: number) {
        this.state = seed;
    }

    /** 다음 난수 생성 (0~1) */
    next(): number {
        this.state = (this.state * 1664525 + 1013904223) & 0xFFFFFFFF;
        return (this.state >>> 0) / 0xFFFFFFFF;
    }

    /** 정수 난수 (min~max) */
    nextInt(min: number, max: number): number {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    /** 현재 상태 스냅샷 */
    getState(): number {
        return this.state;
    }
}

export class DeterministicLockstepSync {
    private prng: PRNG;
    private turn = 0;
    private commandQueue: string[] = [];
    private remoteCommandQueue: Map<number, string[]> = new Map();

    constructor(seed: number) {
        this.prng = new PRNG(seed);
    }

    /** 난수 생성 (결정론적) */
    random(): number {
        return this.prng.next();
    }

    /** 커맨드 기록 */
    recordCommand(command: string): void {
        this.commandQueue.push(command);
    }

    /** 프레임 커밋 (턴 종료 시) */
    commitFrame(): LockstepFrame {
        const frame: LockstepFrame = {
            turn: this.turn,
            commands: [...this.commandQueue],
            checksum: this.computeChecksum(),
        };
        this.commandQueue = [];
        return frame;
    }

    /** 원격 프레임 수신 */
    receiveRemoteFrame(turn: number, commands: string[]): void {
        this.remoteCommandQueue.set(turn, commands);
    }

    /** 프레임 실행 (턴 증가) */
    executeFrame(): void {
        const remoteCmds = this.remoteCommandQueue.get(this.turn) ?? [];
        const allCommands = [...this.commandQueue, ...remoteCmds];

        // 모든 커맨드 순차 실행 (실제 게임 로직)
        for (const cmd of allCommands) {
            this.executeCommand(cmd);
        }

        this.turn++;
        this.remoteCommandQueue.delete(this.turn - 1);
    }

    /** 체크섬 (FNV-1a 유사) */
    private computeChecksum(): string {
        let hash = 0x811C9DC5;
        const data = `${this.turn}:${this.prng.getState()}:${this.commandQueue.join(',')}`;
        for (let i = 0; i < data.length; i++) {
            hash ^= data.charCodeAt(i);
            hash = Math.imul(hash, 0x01000193);
        }
        return (hash >>> 0).toString(16);
    }

    private executeCommand(cmd: string): void {
        // 자리표시: 실제 게임 커맨드 실행
    }

    getTurn(): number { return this.turn; }
    getSeed(): number { return (this.prng as any).state; }
}
