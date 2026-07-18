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
export const BUFFER_BYTES = HEADER_BYTES +
    MAX_OFFICERS * OFFICER_BYTES +
    MAX_TILES * TILE_BYTES +
    MAX_COMMANDS * CMD_BYTES;
export const H_MAGIC = 0;
export const H_VERSION = 1;
export const H_FRAME = 2;
export const H_OFFICER_COUNT = 3;
export const H_TILE_COUNT = 4;
export const H_FLAG = 5; // Int32 atomic: 0=idle, 1=worker ready
export const H_READY = 6; // Int32 atomic: 0=not ready, 1=done
export const H_CMD_COUNT = 7;
export const O_ID_HASH = 0;
export const O_Q = 1;
export const O_R = 2;
export const O_HP = 3;
export const O_MAX_HP = 4;
export const O_AP = 5; // actionPoints
export const O_MAX_AP = 6; // maxActionPoints
export const O_STAMINA = 7; // stamina
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
const STATUS_MAP = {
    FREE: 0, ACTIVE: 1, WOUNDED: 2, DEAD: 3,
};
const STATUS_REVERSE = ['FREE', 'ACTIVE', 'WOUNDED', 'DEAD'];
// ============================================================
// [1] 이진 패킹/언패킹
// ============================================================
function idHash(id) {
    let h = 0x811C9DC5 >>> 0;
    for (let i = 0; i < id.length; i++) {
        h ^= id.charCodeAt(i) & 0xFF;
        h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h >>> 0;
}
export class IDResolver {
    constructor() {
        this.forward = new Map();
        this.reverse = new Map();
    }
    register(id) {
        const hash = idHash(id);
        this.forward.set(id, hash);
        if (!this.reverse.has(hash))
            this.reverse.set(hash, id);
        return hash;
    }
    resolve(hash) {
        return this.reverse.get(hash) ?? null;
    }
    hasCollision(id) {
        const hash = idHash(id);
        const existing = this.reverse.get(hash);
        return existing !== undefined && existing !== id;
    }
}
export function packOfficer(buf, offset, officer, city) {
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
export function unpackOfficer(buf, offset, resolver) {
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
        status: STATUS_REVERSE[buf[idx + O_STATUS] | 0],
        hasActedThisTurn: buf[idx + O_HAS_ACTED] > 0.5,
    };
}
export function packCommand(buf, offset, cmd, resolver) {
    const idx = offset * CMD_FLOATS;
    const typeMap = {
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
export function unpackCommand(buf, offset, resolver) {
    const idx = offset * CMD_FLOATS;
    const typeRev = {
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
    get officerCount() { return this.header[H_OFFICER_COUNT]; }
    set officerCount(n) { this.header[H_OFFICER_COUNT] = n; }
    get tileCount() { return this.header[H_TILE_COUNT]; }
    set tileCount(n) { this.header[H_TILE_COUNT] = n; }
    get cmdCount() { return this.header[H_CMD_COUNT]; }
    set cmdCount(n) { this.header[H_CMD_COUNT] = n; }
    get frame() { return this.header[H_FRAME]; }
    set frame(n) { this.header[H_FRAME] = n; }
    get flag() { return this.header[H_FLAG]; }
    set flag(n) { this.header[H_FLAG] = n; }
    /** Atomics.store on H_FLAG via Int32 view */
    atomicStoreFlag(n) { Atomics.store(this._headerI32, H_FLAG, n); }
    /** Atomics.store on H_READY via Int32 view */
    atomicStoreReady(n) { Atomics.store(this._headerI32, H_READY, n); }
    /** Atomics.wait on H_READY */
    atomicWaitReady(expect, timeout) {
        return Atomics.wait(this._headerI32, H_READY, expect, timeout);
    }
    /** Atomics.notify on H_READY */
    atomicNotifyReady() { Atomics.notify(this._headerI32, H_READY, 1); }
    validate() {
        return this.header[H_MAGIC] === MAGIC && this.header[H_VERSION] === 1;
    }
    reset() {
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
export class MainWorkerBridge {
    constructor(workerScriptUrl, useSharedBuffer = true) {
        this.worker = null;
        this.readIndex = 0;
        this.commandQueue = [];
        this.frameCount = 0;
        this.onFrame = null;
        this.isRunning = false;
        this.rafId = 0;
        this.tick = () => {
            if (!this.isRunning)
                return;
            const readBuf = this.buffers[this.readIndex];
            const writeIndex = 1 - this.readIndex;
            const writeBuf = this.buffers[writeIndex];
            // 커맨드 flush → writeBuf
            this.flushCommands(writeBuf);
            // readBuf 렌더링
            if (readBuf.flag > 0) {
                if (this.onFrame)
                    this.onFrame(readBuf, readBuf.frame);
            }
            // worker 시그널
            if (this.worker && this.useSharedBuffer) {
                writeBuf.frame = ++this.frameCount;
                writeBuf.atomicStoreReady(0);
                writeBuf.atomicStoreFlag(1);
                Atomics.notify(writeBuf.header, H_FLAG, 1);
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
        this.useSharedBuffer = useSharedBuffer;
        this.resolver = new IDResolver();
        this.buffers = [new DoubleBuffer(), new DoubleBuffer()];
        if (workerScriptUrl) {
            this.worker = new Worker(workerScriptUrl, { type: 'module' });
            this.worker.onmessage = (e) => {
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
    setFrameCallback(cb) { this.onFrame = cb; }
    start() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        this.frameCount = 0;
        this.tick();
    }
    stop() {
        this.isRunning = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = 0;
        }
    }
    terminate() { this.stop(); this.worker?.terminate(); this.worker = null; }
    enqueueCommand(cmd) {
        if (this.commandQueue.length >= MAX_COMMANDS)
            return;
        this.commandQueue.push(cmd);
    }
    enqueueCommands(cmds) {
        for (const cmd of cmds) {
            if (this.commandQueue.length >= MAX_COMMANDS)
                break;
            this.commandQueue.push(cmd);
        }
    }
    flushCommands(buf) {
        const count = Math.min(this.commandQueue.length, MAX_COMMANDS);
        buf.cmdCount = count;
        for (let i = 0; i < count; i++) {
            packCommand(buf.cmdData, i, this.commandQueue[i], this.resolver);
        }
        this.commandQueue = [];
    }
    onWorkerFrameDone() {
        const wi = 1 - this.readIndex;
        this.buffers[wi].flag = 1;
        this.readIndex = wi;
    }
    get currentReadBuffer() { return this.buffers[this.readIndex]; }
}
export function createBinaryWorkerEntry(processFrame) {
    const ctx = self;
    let buffers = null;
    let resolver = null;
    let initialized = false;
    ctx.onmessage = (e) => {
        const msg = e.data;
        if (msg.type === 'BRIDGE_INIT') {
            const sab0 = msg.buffers?.[0];
            const sab1 = msg.buffers?.[1];
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
            }
            catch (err) {
                ctx.postMessage({ type: 'BRIDGE_ERROR', error: String(err) });
            }
        }
        if (msg.type === 'BRIDGE_TICK') {
            if (!initialized || !buffers || !resolver)
                return;
            const writeIndex = msg.writeIndex;
            const frame = msg.frame;
            const wb = buffers[writeIndex];
            // Atomically check if main sent us new data
            if (wb.flag > 0) {
                wb.flag = 0; // consume flag
                const cmds = readCommands(wb, resolver);
                const fctx = { frame, writeBuffer: wb, commands: cmds, resolver };
                processFrame(fctx);
                wb.atomicStoreReady(1);
                Atomics.notify(wb.header, H_READY, 1);
                ctx.postMessage({ type: 'BRIDGE_FRAME_DONE', frame });
            }
        }
    };
}
function remapBuffer(sab) {
    const b = new DoubleBuffer();
    b.sab = sab;
    b.header = new Uint32Array(sab, 0, HEADER_U32);
    b.officerData = new Float32Array(sab, HEADER_BYTES, MAX_OFFICERS * OFFICER_FLOATS);
    const tileOff = HEADER_BYTES + MAX_OFFICERS * OFFICER_BYTES;
    b.tileData = new Float32Array(sab, tileOff, MAX_TILES * TILE_FLOATS);
    b.cmdData = new Float32Array(sab, tileOff + MAX_TILES * TILE_BYTES, MAX_COMMANDS * CMD_FLOATS);
    return b;
}
function readCommands(buf, resolver) {
    const count = buf.cmdCount;
    const cmds = [];
    for (let i = 0; i < count; i++) {
        cmds.push(unpackCommand(buf.cmdData, i, resolver));
    }
    return cmds;
}
// ============================================================
// [5] PostMessage 폴백 브릿지
// ============================================================
export class PostMessageBridge {
    constructor(workerScriptUrl) {
        this.worker = null;
        this.onFrame = null;
        this.isRunning = false;
        this.rafId = 0;
        this.frameCount = 0;
        this.commandQueue = [];
        this.pendingFrame = false;
        this.pump = () => {
            if (!this.isRunning || !this.worker)
                return;
            if (!this.pendingFrame) {
                this.frameCount++;
                const count = Math.min(this.commandQueue.length, MAX_COMMANDS);
                const cmdData = new Float32Array(count * CMD_FLOATS);
                for (let i = 0; i < count; i++) {
                    packCommand(cmdData, i, this.commandQueue[i], this.resolver);
                }
                this.commandQueue = [];
                const snapshot = new Float32Array(this.readBuf.officerData);
                this.worker.postMessage({ type: 'BRIDGE_TICK', frame: this.frameCount, commands: cmdData, officerSnapshot: snapshot }, { transfer: [cmdData.buffer, snapshot.buffer] });
                this.pendingFrame = true;
            }
            this.rafId = requestAnimationFrame(this.pump);
        };
        this.readBuf = new DoubleBuffer();
        this.resolver = new IDResolver();
        this.worker = new Worker(workerScriptUrl, { type: 'module' });
        this.worker.onmessage = (e) => {
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
                if (this.onFrame)
                    this.onFrame(this.readBuf, this.readBuf.frame);
            }
        };
    }
    setFrameCallback(cb) { this.onFrame = cb; }
    start() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        this.frameCount = 0;
        this.pump();
    }
    stop() {
        this.isRunning = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = 0;
        }
    }
    enqueueCommand(cmd) {
        if (this.commandQueue.length >= MAX_COMMANDS)
            return;
        this.commandQueue.push(cmd);
    }
    enqueueCommands(cmds) {
        for (const cmd of cmds) {
            if (this.commandQueue.length >= MAX_COMMANDS)
                break;
            this.commandQueue.push(cmd);
        }
    }
    terminate() { this.stop(); this.worker?.terminate(); this.worker = null; }
}
//# sourceMappingURL=main_worker_bridge.js.map