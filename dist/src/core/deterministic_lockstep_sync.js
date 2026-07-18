/**
 * [E42] 난수 동화형 멀티플레이어 동기화기 — DeterministicLockstepSync
 *
 * 목적: 네트워크 상에서 탭 간 동일 난수 상태로 완전히 동일한 연산 결과 보장.
 *
 * 핵심 로직:
 *   1. Math.random 배제, Seed 기반 PRNG(LCG) 사용
 *   2. 입력 Command Queue 동기화
 */
/** LCG(Linear Congruential Generator) — 결정론적 난수 */
export class PRNG {
    constructor(seed) {
        this.state = seed;
    }
    /** 다음 난수 생성 (0~1) */
    next() {
        this.state = (this.state * 1664525 + 1013904223) & 0xFFFFFFFF;
        return (this.state >>> 0) / 0xFFFFFFFF;
    }
    /** 정수 난수 (min~max) */
    nextInt(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }
    /** 현재 상태 스냅샷 */
    getState() {
        return this.state;
    }
}
export class DeterministicLockstepSync {
    constructor(seed) {
        this.turn = 0;
        this.commandQueue = [];
        this.remoteCommandQueue = new Map();
        this.prng = new PRNG(seed);
    }
    /** 난수 생성 (결정론적) */
    random() {
        return this.prng.next();
    }
    /** 커맨드 기록 */
    recordCommand(command) {
        this.commandQueue.push(command);
    }
    /** 프레임 커밋 (턴 종료 시) */
    commitFrame() {
        const frame = {
            turn: this.turn,
            commands: [...this.commandQueue],
            checksum: this.computeChecksum(),
        };
        this.commandQueue = [];
        return frame;
    }
    /** 원격 프레임 수신 */
    receiveRemoteFrame(turn, commands) {
        this.remoteCommandQueue.set(turn, commands);
    }
    /** 프레임 실행 (턴 증가) */
    executeFrame() {
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
    computeChecksum() {
        let hash = 0x811C9DC5;
        const data = `${this.turn}:${this.prng.getState()}:${this.commandQueue.join(',')}`;
        for (let i = 0; i < data.length; i++) {
            hash ^= data.charCodeAt(i);
            hash = Math.imul(hash, 0x01000193);
        }
        return (hash >>> 0).toString(16);
    }
    executeCommand(cmd) {
        // 자리표시: 실제 게임 커맨드 실행
    }
    getTurn() { return this.turn; }
    getSeed() { return this.prng.state; }
}
//# sourceMappingURL=deterministic_lockstep_sync.js.map