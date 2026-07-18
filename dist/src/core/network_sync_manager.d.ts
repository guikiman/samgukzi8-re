/**
 * 삼국지 8 리메이크 — Seed 기반 결정론적 턴제 네트워크 동기화 매니저
 * 파일: src/core/network_sync_manager.ts
 *
 * [210] Supabase Realtime 멀티플레이 세션
 * [211] PRNG 시드 동기화 + 결정론적 난수
 * [212] 클리어 데이터 해시 서명 검증 / 데싱크 감지
 *
 * ── 아키텍처 ──
 *
 * NetworkSyncManager
 *  ├─ PRNG           — Seed 기반 결정론적 난수 엔진 (LCG + Mulberry32)
 *  ├─ LockstepEngine — 프레임 틱 동기화 + Supabase Realtime 채널
 *  └─ DesyncDetector — FNV-1a 체크섬 비교 + 자동 롤백
 *
 * 결정론적 동기화 원리:
 *   두 클라이언트가 동일한 Seed로 PRNG를 초기화하고,
 *   동일한 횟수로 난수를 호출하면(X_{n+1} = f(X_n)),
 *   명령어(Command)만 교환해도 완전히 동일한 전투 결과 도출.
 *
 * Lockstep Protocol:
 *   Frame N:
 *   [Client A] ──CMD_A──▶                    [Client B]
 *                          [Supabase 채널]
 *   [Client A] ◀──FRAME_READY(CMD_A+CMD_B)── [Client B]
 *   [Client A] execute(N, combined)          [Client B] execute(N, combined)
 *   [Client A] ──CHECKSUM──▶                [Client B] ──CHECKSUM──▶
 *                          [검증: 동일?]
 *                          YES → advance N+1
 *                          NO  → DESYNC → rollback N-1
 */
import { CommandType, OfficerID } from './types.js';
import { GameStore } from './game_store.js';
/**
 * PRNG — Seed 기반 결정론적 난수 생성기
 *
 * 알고리즘: Mulberry32 (32비트 상태, 주기 2^32)
 *   X_{n+1} = X_n + 0x6D2B79F5 (mod 2^32)
 *   t = (X_n XOR (X_n >> 15)) * (1 | X_n)
 *   t = (t + (t XOR (t >> 7)) * (61 | t)) XOR t
 *   return (t XOR (t >> 14)) / 2^32
 *
 * 선형 합동법(LCG) 호환성:
 *   X_{n+1} = (a * X_n + c) mod m
 *   a = 1664525, c = 1013904223, m = 2^32
 *   → 건너뛰기(skip) 연산에 LCG 사용, 품질 수열에 Mulberry32
 *
 * 결정론적 보장:
 *   - 동일 seed + 동일 호출 횟수 → 100% 동일 수열
 *   - 호출 카운터(callCount)로 위치 추적
 *   - copy()로 스냅샷 저장 및 복원 가능
 */
export declare class PRNG {
    private state;
    private _callCount;
    readonly seed: number;
    private static readonly LCG_A;
    private static readonly LCG_C;
    private static readonly LCG_M;
    constructor(seed?: number);
    /** [0, 1) 부동소수점 난수 — Mulberry32 */
    next(): number;
    /** [min, max) 정수 난수 */
    nextInt(min: number, max: number): number;
    /** [min, max] 포함 정수 난수 */
    nextIntInclusive(min: number, max: number): number;
    /** [min, max) 부동소수점 난수 */
    nextFloat(min: number, max: number): number;
    /** true/false 난수 (pTrue = true 확률, 기본 0.5) */
    nextBool(pTrue?: number): boolean;
    /** 정규 분포 근사 (Box-Muller) */
    nextGaussian(mean?: number, stddev?: number): number;
    /** 현재 상태의 깊은 복사 (독립적인 스냅샷) */
    copy(): PRNG;
    /** n步 건너뛰기 (LCG 기반) */
    skip(n: number): void;
    /** 상태를 seed로 리셋 */
    reset(newSeed?: number): void;
    get callCount(): number;
    /** 현재 상태를 JSON 직렬화 (재현용) */
    serialize(): string;
    /** 직렬화된 상태 복원 */
    static deserialize(json: string): PRNG;
    /**
     * 전투용 유틸리티: 크리티컬 확률 판정
     * @param critRate 0.0 ~ 1.0
     */
    rollCritical(critRate: number): boolean;
    /**
     * 전투용 유틸리티: 명중 판정
     * @param accuracy 0.0 ~ 1.0
     */
    rollHit(accuracy: number): boolean;
    /**
     * 전투용 유틸리티: 상태이상 발동 판정
     * @param procRate 0.0 ~ 1.0
     */
    rollStatusEffect(procRate: number): boolean;
    /**
     * 전투용 유틸리티: 데미지 변동 (±spread%)
     * @param baseDamage 기본 데미지
     * @param spread 변동폭 (0.0 ~ 1.0, 기본 0.1 = ±10%)
     */
    rollDamageVariance(baseDamage: number, spread?: number): number;
}
/** 플레이어 ID */
export type PlayerID = string;
/** 방/세션 ID */
export type RoomID = string;
/** Lockstep 프레임 번호 */
export type FrameNumber = number;
/** 플레이어가 제출한 커맨드 패킷 */
export interface PlayerCommandPacket {
    readonly playerId: PlayerID;
    readonly frame: FrameNumber;
    readonly commands: readonly SerializedPlayerCommand[];
    readonly prngCallCount: number;
    readonly checksum: string;
    readonly timestamp: number;
}
/** 직렬화된 플레이어 커맨드 */
export interface SerializedPlayerCommand {
    readonly type: CommandType;
    readonly officerId: OfficerID;
    readonly targetId?: string;
    readonly payload: Record<string, unknown>;
}
/** 서버가 브로드캐스트하는 프레임 패키지 */
export interface FramePackage {
    readonly frame: FrameNumber;
    readonly seed: number;
    readonly playerPackets: readonly PlayerCommandPacket[];
    readonly combinedChecksum: string;
    readonly timestamp: number;
}
/** 데싱크 감지 보고서 */
export interface DesyncReport {
    readonly frame: FrameNumber;
    readonly localChecksum: string;
    readonly remoteChecksum: string;
    readonly localPrngCalls: number;
    readonly remotePrngCalls: number;
    readonly timestamp: number;
}
/** 네트워크 동기화 상태 */
export type SyncState = 'DISCONNECTED' | 'CONNECTING' | 'SYNCING' | 'IN_GAME' | 'DESYNCED' | 'RECONNECTING';
/** 콜백 타입 */
export type OnFrameReady = (pkg: FramePackage) => void;
export type OnDesync = (report: DesyncReport) => void;
export type OnStateChange = (state: SyncState, prevState: SyncState) => void;
export type OnError = (error: NetworkError) => void;
export interface NetworkError {
    readonly code: string;
    readonly message: string;
    readonly frame?: FrameNumber;
}
export declare class SupabaseRealtimeChannel {
    private supabaseUrl;
    private supabaseKey;
    private channel;
    private roomId;
    private playerId;
    isAvailable: boolean;
    constructor(supabaseUrl: string, supabaseKey: string, roomId: RoomID, playerId: PlayerID);
    private isSupabaseClient;
    connect(onCommand: (packet: PlayerCommandPacket) => void, onFrameReady: (pkg: FramePackage) => void, onDesync: (report: DesyncReport) => void, onError: (err: NetworkError) => void): Promise<boolean>;
    sendCommand(packet: PlayerCommandPacket): Promise<void>;
    sendFrameReady(pkg: FramePackage): Promise<void>;
    sendDesync(report: DesyncReport): Promise<void>;
    disconnect(): void;
}
/**
 * LockstepEngine — 프레임 틱 동기화 엔진
 *
 * 프로토콜:
 *   1. JOIN: 두 플레이어가 동일한 roomId로 입장
 *   2. SYNC: seed + frame 0 동기화
 *   3. COMMAND: 각 플레이어가 frame N의 커맨드 제출
 *   4. FRAME_READY: 양측 커맨드 수집 시 브로드캐스트
 *   5. EXECUTE: 양측 동시에 frame N 실행
 *   6. CHECKSUM: 실행 후 체크섬 교환 및 검증
 *   7. ADVANCE: N → N+1 (3번으로)
 *   8. DESYNC: 체크섬 불일치 시 → 롤백 + 재동기
 */
export declare class LockstepEngine {
    private frame;
    private seed;
    private readonly prng;
    private readonly store;
    private readonly channel;
    private readonly playerId;
    private readonly roomId;
    private receivedPackets;
    private players;
    private pendingFramePackage;
    private onFrameReady;
    private onDesync;
    private onError;
    private _state;
    private onStateChange;
    constructor(store: GameStore, supabaseUrl: string, supabaseKey: string, roomId: RoomID, playerId: PlayerID);
    setCallbacks(cbs: {
        onFrameReady: OnFrameReady;
        onDesync: OnDesync;
        onError: OnError;
        onStateChange?: OnStateChange;
    }): void;
    connect(players: PlayerID[]): Promise<boolean>;
    /** 게임 시작 (seed 동기화 완료 후) */
    startGame(initialSeed: number): void;
    /** 현재 프레임의 커맨드 제출 */
    submitCommands(commands: readonly SerializedPlayerCommand[]): Promise<void>;
    /** 연결 해제 */
    disconnect(): void;
    /**
     * 다음 프레임으로 진행.
     * 양측 커맨드가 수집되었을 때만 실행 가능.
     * 이 메서드는 LockstepEngine 내부에서 프레임 패키지 수신 시 자동 호출됨.
     */
    private advanceFrame;
    /**
     * 프레임 실행 후 체크섬 검증.
     * onFrameReady 콜백에서 프레임 실행 후 호출해야 함.
     */
    verifyChecksum(): boolean;
    /** 데싱크 발생 → 이전 프레임으로 롤백 */
    rollbackFrame(store: GameStore, targetFrame: number): Promise<void>;
    private onCommandReceived;
    private onFramePackageReceived;
    private onDesyncReport;
    private triggerDesync;
    private setState;
    get syncState(): SyncState;
    get currentFrame(): FrameNumber;
    get currentSeed(): number;
    get room(): RoomID;
}
export type SyncConfig = {
    readonly supabaseUrl: string;
    readonly supabaseKey: string;
    readonly roomId: RoomID;
    readonly playerId: PlayerID;
    readonly players: PlayerID[];
    readonly onFrameReady: OnFrameReady;
    readonly onDesync?: OnDesync;
    readonly onStateChange?: OnStateChange;
    readonly onError?: OnError;
};
/**
 * NetworkSyncManager — Seed 기반 결정론적 턴제 네트워크 동기화 통합 매니저
 *
 * 사용 예:
 * ```typescript
 * const sync = new NetworkSyncManager(store, {
 *     supabaseUrl: 'https://xxx.supabase.co',
 *     supabaseKey: 'public-anon-key',
 *     roomId: 'room_abc123',
 *     playerId: 'player_1',
 *     players: ['player_1', 'player_2'],
 *     onFrameReady: (pkg) => { /* execute frame *\/ },
 * });
 *
 * await sync.connect();
 *
 * // 매 턴:
 * sync.submitCommands([/* player commands *\/]);
 *
 * // 프레임 실행 후:
 * sync.verifyChecksum(); // true → advance, false → desync
 * ```
 */
export declare class NetworkSyncManager {
    readonly prng: PRNG;
    readonly lockstep: LockstepEngine;
    private readonly store;
    private readonly config;
    constructor(store: GameStore, config: SyncConfig);
    /** Supabase Realtime 연결 + Lockstep 초기화 */
    connect(): Promise<boolean>;
    /** 게임 시작 (seed 동기화 완료 후) */
    startGame(seed?: number): void;
    /** 현재 프레임의 커맨드 제출 */
    submitCommands(commands: readonly SerializedPlayerCommand[]): Promise<void>;
    /** 프레임 실행 후 체크섬 검증 */
    verifyChecksum(): boolean;
    /** 데싱크 발생 시 롤백 */
    rollbackFrame(targetFrame: number): Promise<void>;
    /** 전투용: 결정론적 PRNG로 크리티컬 판정 */
    rollCritical(critRate: number): boolean;
    /** 전투용: 결정론적 PRNG로 명중 판정 */
    rollHit(accuracy: number): boolean;
    /** 전투용: 결정론적 PRNG로 데미지 변동 */
    rollDamageVariance(baseDamage: number, spread?: number): number;
    /** 연결 해제 */
    disconnect(): void;
    get syncState(): SyncState;
    get currentFrame(): number;
    get currentSeed(): number;
}
//# sourceMappingURL=network_sync_manager.d.ts.map