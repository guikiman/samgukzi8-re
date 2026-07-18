import { Officer, City, CommandType } from './types.js';
export declare const OFFICER_FLOATS = 16;
export declare const OFFICER_BYTES: number;
export declare const TILE_FLOATS = 8;
export declare const TILE_BYTES: number;
export declare const CMD_FLOATS = 6;
export declare const CMD_BYTES: number;
export declare const HEADER_U32 = 8;
export declare const HEADER_BYTES: number;
export declare const MAX_OFFICERS = 1500;
export declare const MAX_TILES = 500;
export declare const MAX_COMMANDS = 200;
export declare const BUFFER_BYTES: number;
export declare const H_MAGIC = 0;
export declare const H_VERSION = 1;
export declare const H_FRAME = 2;
export declare const H_OFFICER_COUNT = 3;
export declare const H_TILE_COUNT = 4;
export declare const H_FLAG = 5;
export declare const H_READY = 6;
export declare const H_CMD_COUNT = 7;
export declare const O_ID_HASH = 0;
export declare const O_Q = 1;
export declare const O_R = 2;
export declare const O_HP = 3;
export declare const O_MAX_HP = 4;
export declare const O_AP = 5;
export declare const O_MAX_AP = 6;
export declare const O_STAMINA = 7;
export declare const O_FACTION_HASH = 8;
export declare const O_CITY_HASH = 9;
export declare const O_STATUS = 10;
export declare const O_HAS_ACTED = 11;
export declare const O_LEADERSHIP = 12;
export declare const O_MIGHT = 13;
export declare const O_INTEL = 14;
export declare const O_POLITICS = 15;
export declare const T_Q = 0;
export declare const T_R = 1;
export declare const T_HEIGHT = 2;
export declare const T_MOVE_COST = 3;
export declare const T_OWNER_HASH = 4;
export declare const T_FOW = 5;
export declare const T_FEATURE = 6;
export declare const T_WEATHER = 7;
export declare const C_TYPE = 0;
export declare const C_OFFICER_HASH = 1;
export declare const C_TARGET_HASH = 2;
export declare const C_PAYLOAD0 = 3;
export declare const C_PAYLOAD1 = 4;
export declare const C_PAYLOAD2 = 5;
export declare class IDResolver {
    private readonly forward;
    private readonly reverse;
    register(id: string): number;
    resolve(hash: number): string | null;
    hasCollision(id: string): boolean;
}
export declare function packOfficer(buf: Float32Array, offset: number, officer: Officer, city: City | null): void;
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
export declare function unpackOfficer(buf: Float32Array, offset: number, resolver: IDResolver): UnpackedOfficer;
export interface BinaryCommand {
    type: CommandType;
    officerId: string;
    targetId: string;
    payload: readonly number[];
}
export declare function packCommand(buf: Float32Array, offset: number, cmd: BinaryCommand, resolver: IDResolver): void;
export declare function unpackCommand(buf: Float32Array, offset: number, resolver: IDResolver): BinaryCommand;
export declare class DoubleBuffer {
    sab: SharedArrayBuffer;
    header: Uint32Array;
    officerData: Float32Array;
    tileData: Float32Array;
    cmdData: Float32Array;
    /** Int32 view of header for Atomics.store/wait/notify */
    private _headerI32;
    constructor();
    get officerCount(): number;
    set officerCount(n: number);
    get tileCount(): number;
    set tileCount(n: number);
    get cmdCount(): number;
    set cmdCount(n: number);
    get frame(): number;
    set frame(n: number);
    get flag(): number;
    set flag(n: number);
    /** Atomics.store on H_FLAG via Int32 view */
    atomicStoreFlag(n: number): void;
    /** Atomics.store on H_READY via Int32 view */
    atomicStoreReady(n: number): void;
    /** Atomics.wait on H_READY */
    atomicWaitReady(expect: number, timeout?: number): string;
    /** Atomics.notify on H_READY */
    atomicNotifyReady(): void;
    validate(): boolean;
    reset(): void;
}
export type FrameTickCallback = (buffer: DoubleBuffer, frame: number) => void;
export declare class MainWorkerBridge {
    private worker;
    private readonly buffers;
    private readIndex;
    private readonly resolver;
    private commandQueue;
    private frameCount;
    private onFrame;
    private isRunning;
    private rafId;
    private readonly useSharedBuffer;
    constructor(workerScriptUrl?: string, useSharedBuffer?: boolean);
    setFrameCallback(cb: FrameTickCallback): void;
    start(): void;
    stop(): void;
    terminate(): void;
    enqueueCommand(cmd: BinaryCommand): void;
    enqueueCommands(cmds: readonly BinaryCommand[]): void;
    private tick;
    private flushCommands;
    private onWorkerFrameDone;
    get currentReadBuffer(): DoubleBuffer;
}
export interface WorkerFrameContext {
    readonly frame: number;
    readonly writeBuffer: DoubleBuffer;
    readonly commands: readonly BinaryCommand[];
    readonly resolver: IDResolver;
}
export declare function createBinaryWorkerEntry(processFrame: (ctx: WorkerFrameContext) => void): void;
export declare class PostMessageBridge {
    private worker;
    private onFrame;
    private isRunning;
    private rafId;
    private frameCount;
    private readBuf;
    private commandQueue;
    private resolver;
    private pendingFrame;
    constructor(workerScriptUrl: string);
    setFrameCallback(cb: FrameTickCallback): void;
    start(): void;
    stop(): void;
    enqueueCommand(cmd: BinaryCommand): void;
    enqueueCommands(cmds: readonly BinaryCommand[]): void;
    private pump;
    terminate(): void;
}
//# sourceMappingURL=main_worker_bridge.d.ts.map