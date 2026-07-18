/**
 * [Tasks 1~50] SisyphusGameOrchestrator — 메인 오케스트레이터
 *
 * 결정론적 턴 제어, 상태 동기화, 커맨드 검증,
 * 비동기 렌더 큐 연동 및 5단계 50개 과업 통합 엔진.
 */

import { GameCalendar } from "./game_calendar";
import { freezeState, deepClone } from "./state_immutability";
import { Xoshiro128 } from "./prng_xoshiro";
import { EventBus, GameEvent, GameEventListener, Unsubscriber } from "./event_bus";
import { TurnPriorityQueue, OfficerRank, TurnEntry } from "./turn_priority_queue";
import { StateBackupStack } from "./state_backup";
import { SchemaValidator, ValidationResult } from "./state_validator";
import { FsmTransitionGuard } from "./fsm_transition_guard";
import { CommandTimeoutWatchdog } from "./command_timeout_watchdog";
import { AsyncMutex } from "./async_mutex";
import { TickRateThrottler, SpeedMultiplier } from "./tick_rate_throttler";
import { LoopErrorBoundary } from "./loop_error_boundary";

export enum GamePhase {
  INITIALIZING = "INITIALIZING",
  TURN_START = "TURN_START",
  COMMAND_INPUT = "COMMAND_INPUT",
  RESOLUTION = "RESOLUTION",
  TURN_END = "TURN_END",
  GAME_OVER = "GAME_OVER",
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

export class SisyphusGameOrchestrator implements IGameOrchestrator {
  private state!: GameState;
  private isRunning = false;
  private isPaused = false;
  private readonly bus = new EventBus();
  private readonly rng: Xoshiro128;
  private readonly validator = new SchemaValidator();
  private readonly fsmGuard = new FsmTransitionGuard();
  private readonly priorityQueue = new TurnPriorityQueue();
  private readonly backupStack = new StateBackupStack<GameState>(5);
  private readonly watchdog = new CommandTimeoutWatchdog();
  private readonly resolutionMutex = new AsyncMutex();
  private readonly tickRate = new TickRateThrottler();
  private readonly errorBoundary = new LoopErrorBoundary();
  private renderQueue: RenderCommand[] = [];
  private commandBuffer: Array<{ factionId: string; command: unknown }> = [];
  private tickCount = 0;

  constructor(seed = Date.now()) {
    this.rng = new Xoshiro128(seed);

    this.errorBoundary.setHandler({
      onError: (err, ctx) => {
        this.bus.emit("ENGINE_ERROR", { error: err.message, context: ctx, tick: this.tickCount }, "error");
      },
      onRecovery: () => {
        this.bus.emit("ENGINE_RECOVERY", { message: "연속 에러 감지 — 엔진 일시정지" }, "warn");
        this.pause();
      },
    });
  }

  async initialize(initialState: Partial<GameState>): Promise<void> {
    const cal = initialState.calendar ?? new GameCalendar(184, 1);
    this.state = {
      calendar: cal,
      currentTurn: initialState.currentTurn ?? 1,
      currentPhase: GamePhase.INITIALIZING,
      activeFactionId: initialState.activeFactionId ?? "",
      seed: this.rng.getState()[0],
      rngState: this.rng.getState(),
      turnQueue: initialState.turnQueue ?? [],
      factions: initialState.factions ?? new Map(),
      officers: initialState.officers ?? new Map(),
      cities: initialState.cities ?? new Map(),
      renderQueue: [],
    };

    this.validateInitialState();
    this.bus.emit("SYSTEM_INIT", { message: "SisyphusEngine initialized", turn: this.state.currentTurn }, "info");
  }

  private validateInitialState(): void {
    const result = this.validator.validateRequired(this.state as unknown as Record<string, unknown>, {
      calendar: "달력",
      currentTurn: "현재 턴",
      currentPhase: "현재 페이즈",
    });
    if (!result.valid) {
      for (const err of result.errors) {
        this.bus.emit("VALIDATION_ERROR", err, "error");
      }
    }
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.state = { ...this.state, currentPhase: GamePhase.TURN_START };
    this.bus.emit("ENGINE_START", { turn: this.state.currentTurn }, "info");
    this.gameLoop();
  }

  pause(): void {
    this.isPaused = true;
    this.bus.emit("ENGINE_PAUSE", null, "info");
  }

  resume(): void {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.bus.emit("ENGINE_RESUME", { turn: this.state.currentTurn }, "info");
    if (!this.isRunning) {
      this.isRunning = true;
      this.gameLoop();
    }
  }

  submitCommand(factionId: string, command: unknown): void {
    if (this.state.currentPhase !== GamePhase.COMMAND_INPUT) {
      throw new Error(`명령은 COMMAND_INPUT 단계에서만 가능. 현재: ${this.state.currentPhase}`);
    }
    this.commandBuffer.push({ factionId, command });
    this.watchdog.markSubmitted(factionId);
  }

  private async gameLoop(): Promise<void> {
    while (this.isRunning) {
      if (this.isPaused) {
        await new Promise((r) => setTimeout(r, 50));
        continue;
      }

      const phase = this.state.currentPhase;
      await this.errorBoundary.execute(`phase_${phase}`, async () => {
        switch (phase) {
          case GamePhase.TURN_START:
            await this.handleTurnStart();
            break;
          case GamePhase.COMMAND_INPUT:
            await this.handleCommandInput();
            break;
          case GamePhase.RESOLUTION:
            await this.handleResolution();
            break;
          case GamePhase.TURN_END:
            await this.handleTurnEnd();
            break;
          case GamePhase.GAME_OVER:
            this.isRunning = false;
            return null;
        }
        return null;
      });

      if (this.errorBoundary.hasTooManyErrors) break;
      await this.tickRate.delay();
      this.tickCount++;
    }
  }

  private async handleTurnStart(): Promise<void> {
    this.backupStack.push(this.state);
    this.watchdog.cancel();

    this.calendar.advanceTurn();
    this.state = { ...this.state, calendar: this.calendar };

    this.emitPhaseChange(GamePhase.COMMAND_INPUT);

    this.bus.emit("TURN_START", {
      turn: this.state.currentTurn,
      season: this.calendar.season,
      date: this.calendar.toString(),
    }, "info");

    this.bus.emit("INCOME_PROCESS", {
      factions: Array.from(this.state.factions.values()).map((f) => ({
        id: f.id,
        gold: f.gold + this.rng.int(50, 200),
        rice: f.rice + this.rng.int(100, 500),
      })),
    }, "info");
  }

  private async handleCommandInput(): Promise<void> {
    this.commandBuffer = [];
    this.watchdog.reset(Array.from(this.state.factions.keys()));

    const aiFactions = Array.from(this.state.factions.values()).filter((f) => f.id !== this.state.activeFactionId);
    for (const f of aiFactions) {
      this.commandBuffer.push({ factionId: f.id, command: { type: "ai_default", turns: 1 } });
      this.watchdog.markSubmitted(f.id);
    }

    if (this.watchdog.isAllSubmitted(Array.from(this.state.factions.keys()))) {
      this.emitPhaseChange(GamePhase.RESOLUTION);
    }
  }

  private async handleResolution(): Promise<void> {
    await this.resolutionMutex.acquire();

    try {
      this.bus.emit("RESOLUTION_STARTED", { commandsCount: this.commandBuffer.length }, "info");

      const lockAcquired = !this.resolutionMutex.isLocked;

      for (const cmd of this.commandBuffer) {
        const renderCmd = this.executeCommand(cmd.factionId, cmd.command);
        if (renderCmd) {
          this.renderQueue.push(renderCmd);
          this.bus.emit("RENDER_QUEUE_PUSH", renderCmd, "info");
        }
      }

      this.commandBuffer = [];
      this.emitPhaseChange(GamePhase.TURN_END);
    } finally {
      this.resolutionMutex.release();
    }
  }

  private async handleTurnEnd(): Promise<void> {
    this.state = {
      ...this.state,
      currentTurn: this.state.currentTurn + 1,
    };

    const queue = this.priorityQueue.getQueue();
    const ordered = this.priorityQueue.reorderAfterTurn();

    this.bus.emit("TURN_CHANGED", { newTurn: this.state.currentTurn }, "info");
    this.bus.emit("RENDER_FLUSH", { renderQueue: this.renderQueue }, "info");
    this.renderQueue = [];

    this.emitPhaseChange(GamePhase.TURN_START);
  }

  private emitPhaseChange(to: GamePhase): void {
    const from = this.state.currentPhase;
    this.fsmGuard.validateOrThrow(from, to);
    this.state = { ...this.state, currentPhase: to };
    this.bus.emit("PHASE_CHANGED", { from, to }, "info");
  }

  private executeCommand(factionId: string, _command: unknown): RenderCommand | null {
    const factionExists = this.state.factions.has(factionId);
    if (!factionExists) return null;

    return {
      type: "FACTION_ACTION",
      payload: { factionId, timestamp: Date.now() },
    };
  }

  subscribe(eventType: string, listener: GameEventListener): Unsubscriber {
    return this.bus.subscribe(eventType, listener);
  }

  getState(): Readonly<GameState> {
    return freezeState({
      ...this.state,
      rngState: this.rng.getState(),
      renderQueue: [...this.renderQueue],
    });
  }

  setSpeed(speed: SpeedMultiplier): void {
    this.tickRate.setSpeed(speed);
    this.bus.emit("SPEED_CHANGED", { speed }, "info");
  }

  async loadSave(data: string): Promise<void> {
    const parsed = JSON.parse(data);
    const cal = new GameCalendar(parsed.calendar.year, parsed.calendar.month);
    this.state = {
      ...parsed,
      calendar: cal,
      renderQueue: [],
    };
    this.rng.setState(new Uint32Array(parsed.rngState));
    this.bus.emit("SAVE_LOADED", { turn: this.state.currentTurn }, "info");
  }

  exportSave(): string {
    const snapshot = deepClone({
      ...this.state,
      renderQueue: [],
    });
    return JSON.stringify(snapshot);
  }

  private get calendar(): GameCalendar {
    return this.state.calendar;
  }
}
