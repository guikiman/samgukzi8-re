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
export declare class PRNG {
    private state;
    constructor(seed: number);
    /** 다음 난수 생성 (0~1) */
    next(): number;
    /** 정수 난수 (min~max) */
    nextInt(min: number, max: number): number;
    /** 현재 상태 스냅샷 */
    getState(): number;
}
export declare class DeterministicLockstepSync {
    private prng;
    private turn;
    private commandQueue;
    private remoteCommandQueue;
    constructor(seed: number);
    /** 난수 생성 (결정론적) */
    random(): number;
    /** 커맨드 기록 */
    recordCommand(command: string): void;
    /** 프레임 커밋 (턴 종료 시) */
    commitFrame(): LockstepFrame;
    /** 원격 프레임 수신 */
    receiveRemoteFrame(turn: number, commands: string[]): void;
    /** 프레임 실행 (턴 증가) */
    executeFrame(): void;
    /** 체크섬 (FNV-1a 유사) */
    private computeChecksum;
    private executeCommand;
    getTurn(): number;
    getSeed(): number;
}
//# sourceMappingURL=deterministic_lockstep_sync.d.ts.map