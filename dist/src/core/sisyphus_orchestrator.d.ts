/**
 * [Tasks 1~50] SisyphusGameOrchestrator — 메인 오케스트레이터
 *
 * 결정론적 턴 제어, 상태 동기화, 커맨드 검증,
 * 비동기 렌더 큐 연동 및 5단계 50개 과업 통합 엔진.
 */
import { GameCalendar } from "./game_calendar";
import { GameEventListener, Unsubscriber } from "./event_bus";
import { OfficerRank, TurnEntry } from "./turn_priority_queue";
import { SpeedMultiplier } from "./tick_rate_throttler";
export declare enum GamePhase {
    INITIALIZING = "INITIALIZING",
    TURN_START = "TURN_START",
    COMMAND_INPUT = "COMMAND_INPUT",
    RESOLUTION = "RESOLUTION",
    TURN_END = "TURN_END",
    GAME_OVER = "GAME_OVER"
}
export interface GameState {
    readonly calendar: GameCalendar;
    readonly currentTurn: number;
    readonly currentPhase: GamePhase;
    readonly activeFactionId: string;
    readonly seed: number;
    readonly rngState: Readonly<Uint32Array>;
    readonly turnQueue: readonly TurnEntry[];
    readonly factions: Map<string, FactionState>;
    readonly officers: Map<string, OfficerState>;
    readonly cities: Map<string, CityState>;
    readonly renderQueue: readonly RenderCommand[];
}
export interface FactionState {
    readonly id: string;
    readonly name: string;
    readonly gold: number;
    readonly rice: number;
    readonly officerIds: readonly string[];
    readonly alive: boolean;
}
export interface OfficerState {
    readonly id: string;
    readonly name: string;
    readonly factionId: string;
    readonly rank: OfficerRank;
    readonly agility: number;
    readonly hp: number;
    readonly maxHp: number;
    readonly location: string;
    readonly alive: boolean;
}
export interface CityState {
    readonly id: string;
    readonly name: string;
    readonly factionId: string;
    readonly population: number;
    readonly gold: number;
    readonly rice: number;
    readonly garrison: number;
    readonly loyalty: number;
}
export interface RenderCommand {
    readonly type: string;
    readonly payload: unknown;
}
export interface IGameOrchestrator {
    initialize(initialState: Partial<GameState>): Promise<void>;
    start(): void;
    pause(): void;
    resume(): void;
    submitCommand(factionId: string, command: unknown): void;
    subscribe(eventType: string, listener: GameEventListener): Unsubscriber;
    getState(): Readonly<GameState>;
    setSpeed(speed: SpeedMultiplier): void;
    loadSave(data: string): Promise<void>;
    exportSave(): string;
}
export declare class SisyphusGameOrchestrator implements IGameOrchestrator {
    private state;
    private isRunning;
    private isPaused;
    private readonly bus;
    private readonly rng;
    private readonly validator;
    private readonly fsmGuard;
    private readonly priorityQueue;
    private readonly backupStack;
    private readonly watchdog;
    private readonly resolutionMutex;
    private readonly tickRate;
    private readonly errorBoundary;
    private renderQueue;
    private commandBuffer;
    private tickCount;
    constructor(seed?: number);
    initialize(initialState: Partial<GameState>): Promise<void>;
    private validateInitialState;
    start(): void;
    pause(): void;
    resume(): void;
    submitCommand(factionId: string, command: unknown): void;
    private gameLoop;
    private handleTurnStart;
    private handleCommandInput;
    private handleResolution;
    private handleTurnEnd;
    private emitPhaseChange;
    private executeCommand;
    subscribe(eventType: string, listener: GameEventListener): Unsubscriber;
    getState(): Readonly<GameState>;
    setSpeed(speed: SpeedMultiplier): void;
    loadSave(data: string): Promise<void>;
    exportSave(): string;
    private get calendar();
}
//# sourceMappingURL=sisyphus_orchestrator.d.ts.map