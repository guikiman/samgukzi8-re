import { Officer, City, CommandType } from './types.js';

// ============================================================
// [0] 이진 포맷 상수
// ============================================================

export const OFFICER_FLOATS = 16;
export const OFFICER_BYTES = OFFICER_FLOATS * 4;
export const TILE_FLOATS = 8;
export const TILE_BYTES = TILE_FLOATS * 4;
export const CMD_FLOATS = 6;
export const CMD_BYTES = CMD_FLOATS * 4;
export const HEADER_U32 = 8;
export const HEADER_BYTES = HEADER_U32 * 4;
export const MAX_OFFICERS = 1500;
export const MAX_TILES = 500;
export const MAX_COMMANDS = 200;
export const BUFFER_BYTES =
    HEADER_BYTES +
    MAX_OFFICERS * OFFICER_BYTES +
    MAX_TILES * TILE_BYTES +
    MAX_COMMANDS * CMD_BYTES;

export const H_MAGIC = 0;
export const H_VERSION = 1;
export const H_FRAME = 2;
export const H_OFFICER_COUNT = 3;
export const H_TILE_COUNT = 4;
export const H_FLAG = 5;      // Int32 atomic: 0=idle, 1=worker ready
export const H_READY = 6;     // Int32 atomic: 0=not ready, 1=done
export const H_CMD_COUNT = 7;

export const O_ID_HASH = 0;
export const O_Q = 1;
export const O_R = 2;
export const O_HP = 3;
export const O_MAX_HP = 4;
export const O_AP = 5;           // actionPoints
export const O_MAX_AP = 6;       // maxActionPoints
export const O_STAMINA = 7;      // stamina
export const O_FACTION_HASH = 8;
export const O_CITY_HASH = 9;
export const O_STATUS = 10;
export const O_HAS_ACTED = 11;
export const O_LEADERSHIP = 12;
export const O_MIGHT = 13;
export const O_INTEL = 14;
export const O_POLITICS = 15;

export const T_Q = 0;
export const T_R = 1;
export const T_HEIGHT = 2;
export const T_MOVE_COST = 3;
export const T_OWNER_HASH = 4;
export const T_FOW = 5;
export const T_FEATURE = 6;
export const T_WEATHER = 7;

export const C_TYPE = 0;
export const C_OFFICER_HASH = 1;
export const C_TARGET_HASH = 2;
export const C_PAYLOAD0 = 3;
export const C_PAYLOAD1 = 4;
export const C_PAYLOAD2 = 5;

const MAGIC = 0x53414D4B;
const STATUS_MAP: Record<string, number> = {
    FREE: 0, ACTIVE: 1, WOUNDED: 2, DEAD: 3,
};
const STATUS_REVERSE = ['FREE', 'ACTIVE', 'WOUNDED', 'DEAD'];

// ============================================================
// [1] 이진 패킹/언패킹
// ============================================================

function idHash(id: string): number {
    let h = 0x811C9DC5 >>> 0;
    for (let i = 0; i < id.length; i++) {
        h ^= id.charCodeAt(i) & 0xFF;
        h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h >>> 0;
}

export class IDResolver {
    private readonly forward = new Map<string, number>();
    private readonly reverse = new Map<number, string>();

    register(id: string): number {
        const hash = idHash(id);
        this.forward.set(id, hash);
        if (!this.reverse.has(hash)) this.reverse.set(hash, id);
        return hash;
    }

    resolve(hash: number): string | null {
        return this.reverse.get(hash) ?? null;
    }

    hasCollision(id: string): boolean {
        const hash = idHash(id);
        const existing = this.reverse.get(hash);
        return existing !== undefined && existing !== id;
    }
}

export function packOfficer(
    buf: Float32Array, offset: number,
    officer: Officer, city: City | null,
): void {
    const idx = offset * OFFICER_FLOATS;
    buf[idx + O_ID_HASH] = idHash(officer.id);
    buf[idx + O_Q] = city?.hexCoord.q ?? 0;
    buf[idx + O_R] = city?.hexCoord.r ?? 0;
    buf[idx + O_HP] = officer.hp;
    buf[idx + O_MAX_HP] = officer.maxHp;
    buf[idx + O_AP] = officer.actionPoints;
    buf[idx + O_MAX_AP] = officer.maxActionPoints;
    buf[idx + O_STAMINA] = officer.stamina;
    buf[idx + O_FACTION_HASH] = idHash(officer.factionId ?? '');
    buf[idx + O_CITY_HASH] = idHash(officer.cityId ?? '');
    buf[idx + O_STATUS] = STATUS_MAP[officer.status] ?? 0;
    buf[idx + O_HAS_ACTED] = officer.hasActedThisTurn ? 1 : 0;
    buf[idx + O_LEADERSHIP] = officer.stats.leadership;
    buf[idx + O_MIGHT] = officer.stats.might;
    buf[idx + O_INTEL] = officer.stats.intelligence;
    buf[idx + O_POLITICS] = officer.stats.politics;
}

export interface UnpackedOfficer {
    id_hash: number;
    hp: number;
    maxHp: number;
    actionPoints: number;
    maxActionPoints: number;
    stamina: number;
    factionId: string | null;
    cityId: string | null;
    status: Officer['status'];
    hasActedThisTurn: boolean;
}

export function unpackOfficer(
    buf: Float32Array, offset: number,
    resolver: IDResolver,
): UnpackedOfficer {
    const idx = offset * OFFICER_FLOATS;
    return {
        id_hash: buf[idx + O_ID_HASH],
        hp: buf[idx + O_HP],
        maxHp: buf[idx + O_MAX_HP],
        actionPoints: buf[idx + O_AP],
        maxActionPoints: buf[idx + O_MAX_AP],
        stamina: buf[idx + O_STAMINA],
        factionId: resolver.resolve(buf[idx + O_FACTION_HASH]),
        cityId: resolver.resolve(buf[idx + O_CITY_HASH]),
        status: STATUS_REVERSE[buf[idx + O_STATUS] | 0] as Officer['status'],
        hasActedThisTurn: buf[idx + O_HAS_ACTED] > 0.5,
    };
}

export interface BinaryCommand {
    type: CommandType;
    officerId: string;
    targetId: string;
    payload: readonly number[];
}

export function packCommand(
    buf: Float32Array, offset: number,
    cmd: BinaryCommand, resolver: IDResolver,
): void {
    const idx = offset * CMD_FLOATS;
    const typeMap: Record<string, number> = {
        DOMESTIC: 0, TRAINING: 1, RECRUITMENT: 2,
        MOVEMENT: 3, DIPLOMACY: 4, BATTLE: 5,
        REST: 6, SOCIAL: 7, SEARCH: 8,
    };
    buf[idx + C_TYPE] = typeMap[cmd.type] ?? 0;
    buf[idx + C_OFFICER_HASH] = resolver.register(cmd.officerId);
    buf[idx + C_TARGET_HASH] = resolver.register(cmd.targetId);
    buf[idx + C_PAYLOAD0] = cmd.payload[0] ?? 0;
    buf[idx + C_PAYLOAD1] = cmd.payload[1] ?? 0;
    buf[idx + C_PAYLOAD2] = cmd.payload[2] ?? 0;
}

export function unpackCommand(
    buf: Float32Array, offset: number,
    resolver: IDResolver,
): BinaryCommand {
    const idx = offset * CMD_FLOATS;
    const typeRev: Record<number, CommandType> = {
        0: 'DOMESTIC', 1: 'TRAINING', 2: 'RECRUITMENT',
        3: 'MOVEMENT', 4: 'DIPLOMACY', 5: 'BATTLE',
        6: 'REST', 7: 'SOCIAL', 8: 'SEARCH',
    };
    return {
        type: typeRev[buf[idx + C_TYPE] | 0] ?? 'DOMESTIC',
        officerId: resolver.resolve(buf[idx + C_OFFICER_HASH]) ?? '',
        targetId: resolver.resolve(buf[idx + C_TARGET_HASH]) ?? '',
        payload: [buf[idx + C_PAYLOAD0], buf[idx + C_PAYLOAD1], buf[idx + C_PAYLOAD2]],
    };
}

// ============================================================
// [2] SharedArrayBuffer 더블 버퍼
// ============================================================

export class DoubleBuffer {
    sab: SharedArrayBuffer;
    header: Uint32Array;
    officerData: Float32Array;
    tileData: Float32Array;
    cmdData: Float32Array;
    /** Int32 view of header for Atomics.store/wait/notify */
    private _headerI32: Int32Array;

    constructor() {
        this.sab = new SharedArrayBuffer(BUFFER_BYTES);
        this.header = new Uint32Array(this.sab, 0, HEADER_U32);
        this._headerI32 = new Int32Array(this.sab, 0, HEADER_U32);

        this.header[H_MAGIC] = MAGIC;
        this.header[H_VERSION] = 1;
        this.header[H_FRAME] = 0;
        this.header[H_OFFICER_COUNT] = 0;
        this.header[H_TILE_COUNT] = 0;
        this.header[H_FLAG] = 0;
        this.header[H_READY] = 0;
        this.header[H_CMD_COUNT] = 0;

        this.officerData = new Float32Array(this.sab, HEADER_BYTES, MAX_OFFICERS * OFFICER_FLOATS);
        this.officerData.fill(0);

        const tileOff = HEADER_BYTES + MAX_OFFICERS * OFFICER_BYTES;
        this.tileData = new Float32Array(this.sab, tileOff, MAX_TILES * TILE_FLOATS);
        this.tileData.fill(0);

        this.cmdData = new Float32Array(this.sab, tileOff + MAX_TILES * TILE_BYTES, MAX_COMMANDS * CMD_FLOATS);
        this.cmdData.fill(0);
    }

    get officerCount(): number { return this.header[H_OFFICER_COUNT]; }
    set officerCount(n: number) { this.header[H_OFFICER_COUNT] = n; }
    get tileCount(): number { return this.header[H_TILE_COUNT]; }
    set tileCount(n: number) { this.header[H_TILE_COUNT] = n; }
    get cmdCount(): number { return this.header[H_CMD_COUNT]; }
    set cmdCount(n: number) { this.header[H_CMD_COUNT] = n; }
    get frame(): number { return this.header[H_FRAME]; }
    set frame(n: number) { this.header[H_FRAME] = n; }
    get flag(): number { return this.header[H_FLAG]; }
    set flag(n: number) { this.header[H_FLAG] = n; }

    /** Atomics.store on H_FLAG via Int32 view */
    atomicStoreFlag(n: number): void { Atomics.store(this._headerI32, H_FLAG, n); }
    /** Atomics.store on H_READY via Int32 view */
    atomicStoreReady(n: number): void { Atomics.store(this._headerI32, H_READY, n); }
    /** Atomics.wait on H_READY */
    atomicWaitReady(expect: number, timeout?: number): string {
        return Atomics.wait(this._headerI32, H_READY, expect, timeout);
    }
    /** Atomics.notify on H_READY */
    atomicNotifyReady(): void { Atomics.notify(this._headerI32, H_READY, 1); }

    validate(): boolean {
        return this.header[H_MAGIC] === MAGIC && this.header[H_VERSION] === 1;
    }

    reset(): void {
        this.header[H_OFFICER_COUNT] = 0;
        this.header[H_TILE_COUNT] = 0;
        this.header[H_CMD_COUNT] = 0;
        this.header[H_FLAG] = 0;
        this.header[H_READY] = 0;
        this.officerData.fill(0);
        this.tileData.fill(0);
        this.cmdData.fill(0);
    }
}

// ============================================================
// [3] 메인 스레드 — MainWorkerBridge
// ============================================================

export type FrameTickCallback = (buffer: DoubleBuffer, frame: number) => void;

export class MainWorkerBridge {
    private worker: Worker | null = null;
    private readonly buffers: [DoubleBuffer, DoubleBuffer];
    private readIndex = 0;
    private readonly resolver: IDResolver;
    private commandQueue: BinaryCommand[] = [];
    private frameCount = 0;
    private onFrame: FrameTickCallback | null = null;
    private isRunning = false;
    private rafId = 0;
    private readonly useSharedBuffer: boolean;

    constructor(workerScriptUrl?: string, useSharedBuffer = true) {
        this.useSharedBuffer = useSharedBuffer;
        this.resolver = new IDResolver();
        this.buffers = [new DoubleBuffer(), new DoubleBuffer()];

        if (workerScriptUrl) {
            this.worker = new Worker(workerScriptUrl, { type: 'module' });
            this.worker.onmessage = (e: MessageEvent) => {
                const msg = e.data;
                if (msg?.type === 'BRIDGE_READY') {
                    this.isRunning = true;
                }
                if (msg?.type === 'BRIDGE_FRAME_DONE') {
                    this.onWorkerFrameDone();
                }
            };
            this.worker.onerror = (err) => {
                console.error('[MainWorkerBridge] Worker error:', err);
            };

            if (useSharedBuffer) {
                this.worker.postMessage({
                    type: 'BRIDGE_INIT',
                    buffers: [this.buffers[0].sab, this.buffers[1].sab],
                });
            }
        }
    }

    setFrameCallback(cb: FrameTickCallback): void { this.onFrame = cb; }

    start(): void {
        if (this.isRunning) return;
        this.isRunning = true;
        this.frameCount = 0;
        this.tick();
    }

    stop(): void {
        this.isRunning = false;
        if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = 0; }
    }

    terminate(): void { this.stop(); this.worker?.terminate(); this.worker = null; }

    enqueueCommand(cmd: BinaryCommand): void {
        if (this.commandQueue.length >= MAX_COMMANDS) return;
        this.commandQueue.push(cmd);
    }

    enqueueCommands(cmds: readonly BinaryCommand[]): void {
        for (const cmd of cmds) {
            if (this.commandQueue.length >= MAX_COMMANDS) break;
            this.commandQueue.push(cmd);
        }
    }

    private tick = (): void => {
        if (!this.isRunning) return;

        const readBuf = this.buffers[this.readIndex];
        const writeIndex = 1 - this.readIndex;
        const writeBuf = this.buffers[writeIndex];

        // 커맨드 flush → writeBuf
        this.flushCommands(writeBuf);

        // readBuf 렌더링
        if (readBuf.flag > 0) {
            if (this.onFrame) this.onFrame(readBuf, readBuf.frame);
        }

        // worker 시그널
        if (this.worker && this.useSharedBuffer) {
            writeBuf.frame = ++this.frameCount;
            writeBuf.atomicStoreReady(0);
            writeBuf.atomicStoreFlag(1);
            Atomics.notify(writeBuf.header as unknown as Int32Array, H_FLAG, 1);

            this.worker.postMessage({ type: 'BRIDGE_TICK', frame: this.frameCount, writeIndex });
        }

        // worker 완료 대기 + readIndex swap
        if (this.useSharedBuffer) {
            writeBuf.atomicWaitReady(0, 5000);
            if (writeBuf.flag > 0) {
                this.readIndex = writeIndex;
            }
        }

        this.rafId = requestAnimationFrame(this.tick);
    };

    private flushCommands(buf: DoubleBuffer): void {
        const count = Math.min(this.commandQueue.length, MAX_COMMANDS);
        buf.cmdCount = count;
        for (let i = 0; i < count; i++) {
            packCommand(buf.cmdData, i, this.commandQueue[i], this.resolver);
        }
        this.commandQueue = [];
    }

    private onWorkerFrameDone(): void {
        const wi = 1 - this.readIndex;
        this.buffers[wi].flag = 1;
        this.readIndex = wi;
    }

    get currentReadBuffer(): DoubleBuffer { return this.buffers[this.readIndex]; }
}

// ============================================================
// [4] Worker 진입점
// ============================================================

export interface WorkerFrameContext {
    readonly frame: number;
    readonly writeBuffer: DoubleBuffer;
    readonly commands: readonly BinaryCommand[];
    readonly resolver: IDResolver;
}

export function createBinaryWorkerEntry(
    processFrame: (ctx: WorkerFrameContext) => void,
): void {
    const ctx = self as unknown as DedicatedWorkerGlobalScope;
    let buffers: [DoubleBuffer, DoubleBuffer] | null = null;
    let resolver: IDResolver | null = null;
    let initialized = false;

    ctx.onmessage = (e: MessageEvent) => {
        const msg = e.data;

        if (msg.type === 'BRIDGE_INIT') {
            const sab0 = msg.buffers?.[0] as SharedArrayBuffer | undefined;
            const sab1 = msg.buffers?.[1] as SharedArrayBuffer | undefined;
            if (!sab0 || !sab1) {
                ctx.postMessage({ type: 'BRIDGE_ERROR', error: 'Missing SharedArrayBuffer' });
                return;
            }

            try {
                const b0 = remapBuffer(sab0);
                const b1 = remapBuffer(sab1);
                buffers = [b0, b1];
                resolver = new IDResolver();
                initialized = true;
                ctx.postMessage({ type: 'BRIDGE_READY' });
            } catch (err) {
                ctx.postMessage({ type: 'BRIDGE_ERROR', error: String(err) });
            }
        }

        if (msg.type === 'BRIDGE_TICK') {
            if (!initialized || !buffers || !resolver) return;

            const writeIndex = msg.writeIndex as number;
            const frame = msg.frame as number;
            const wb = buffers[writeIndex];

            // Atomically check if main sent us new data
            if (wb.flag > 0) {
                wb.flag = 0;  // consume flag

                const cmds = readCommands(wb, resolver);
                const fctx: WorkerFrameContext = { frame, writeBuffer: wb, commands: cmds, resolver };
                processFrame(fctx);

                wb.atomicStoreReady(1);
                Atomics.notify(wb.header as unknown as Int32Array, H_READY, 1);
                ctx.postMessage({ type: 'BRIDGE_FRAME_DONE', frame });
            }
        }
    };
}

function remapBuffer(sab: SharedArrayBuffer): DoubleBuffer {
    const b = new DoubleBuffer();
    b.sab = sab;
    b.header = new Uint32Array(sab, 0, HEADER_U32);
    b.officerData = new Float32Array(sab, HEADER_BYTES, MAX_OFFICERS * OFFICER_FLOATS);
    const tileOff = HEADER_BYTES + MAX_OFFICERS * OFFICER_BYTES;
    b.tileData = new Float32Array(sab, tileOff, MAX_TILES * TILE_FLOATS);
    b.cmdData = new Float32Array(sab, tileOff + MAX_TILES * TILE_BYTES, MAX_COMMANDS * CMD_FLOATS);
    return b;
}

function readCommands(buf: DoubleBuffer, resolver: IDResolver): BinaryCommand[] {
    const count = buf.cmdCount;
    const cmds: BinaryCommand[] = [];
    for (let i = 0; i < count; i++) {
        cmds.push(unpackCommand(buf.cmdData, i, resolver));
    }
    return cmds;
}

// ============================================================
// [5] PostMessage 폴백 브릿지
// ============================================================

export class PostMessageBridge {
    private worker: Worker | null = null;
    private onFrame: FrameTickCallback | null = null;
    private isRunning = false;
    private rafId = 0;
    private frameCount = 0;
    private readBuf: DoubleBuffer;
    private commandQueue: BinaryCommand[] = [];
    private resolver: IDResolver;
    private pendingFrame = false;

    constructor(workerScriptUrl: string) {
        this.readBuf = new DoubleBuffer();
        this.resolver = new IDResolver();
        this.worker = new Worker(workerScriptUrl, { type: 'module' });

        this.worker.onmessage = (e: MessageEvent) => {
            const msg = e.data;
            if (msg?.type === 'BRIDGE_RESULT') {
                if (msg.officerData instanceof Float32Array) {
                    this.readBuf.officerData.set(msg.officerData);
                }
                if (msg.tileData instanceof Float32Array) {
                    this.readBuf.tileData.set(msg.tileData);
                }
                this.readBuf.frame = msg.frame ?? this.frameCount;
                this.readBuf.flag = 1;
                this.pendingFrame = false;

                if (this.onFrame) this.onFrame(this.readBuf, this.readBuf.frame);
            }
        };
    }

    setFrameCallback(cb: FrameTickCallback): void { this.onFrame = cb; }

    start(): void {
        if (this.isRunning) return;
        this.isRunning = true;
        this.frameCount = 0;
        this.pump();
    }

    stop(): void {
        this.isRunning = false;
        if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = 0; }
    }

    enqueueCommand(cmd: BinaryCommand): void {
        if (this.commandQueue.length >= MAX_COMMANDS) return;
        this.commandQueue.push(cmd);
    }

    enqueueCommands(cmds: readonly BinaryCommand[]): void {
        for (const cmd of cmds) {
            if (this.commandQueue.length >= MAX_COMMANDS) break;
            this.commandQueue.push(cmd);
        }
    }

    private pump = (): void => {
        if (!this.isRunning || !this.worker) return;

        if (!this.pendingFrame) {
            this.frameCount++;
            const count = Math.min(this.commandQueue.length, MAX_COMMANDS);
            const cmdData = new Float32Array(count * CMD_FLOATS);
            for (let i = 0; i < count; i++) {
                packCommand(cmdData, i, this.commandQueue[i], this.resolver);
            }
            this.commandQueue = [];

            const snapshot = new Float32Array(this.readBuf.officerData);
            this.worker.postMessage(
                { type: 'BRIDGE_TICK', frame: this.frameCount, commands: cmdData, officerSnapshot: snapshot },
                { transfer: [cmdData.buffer as ArrayBuffer, snapshot.buffer as ArrayBuffer] },
            );
            this.pendingFrame = true;
        }

        this.rafId = requestAnimationFrame(this.pump);
    };

    terminate(): void { this.stop(); this.worker?.terminate(); this.worker = null; }
}
