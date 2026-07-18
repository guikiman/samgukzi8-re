/**
 * [Tasks 1~50] SisyphusGameOrchestrator — 메인 오케스트레이터
 *
 * 결정론적 턴 제어, 상태 동기화, 커맨드 검증,
 * 비동기 렌더 큐 연동 및 5단계 50개 과업 통합 엔진.
 */
import { GameCalendar } from "./game_calendar";
import { freezeState, deepClone } from "./state_immutability";
import { Xoshiro128 } from "./prng_xoshiro";
import { EventBus } from "./event_bus";
import { TurnPriorityQueue } from "./turn_priority_queue";
import { StateBackupStack } from "./state_backup";
import { SchemaValidator } from "./state_validator";
import { FsmTransitionGuard } from "./fsm_transition_guard";
import { CommandTimeoutWatchdog } from "./command_timeout_watchdog";
import { AsyncMutex } from "./async_mutex";
import { TickRateThrottler } from "./tick_rate_throttler";
import { LoopErrorBoundary } from "./loop_error_boundary";
export var GamePhase;
(function (GamePhase) {
    GamePhase["INITIALIZING"] = "INITIALIZING";
    GamePhase["TURN_START"] = "TURN_START";
    GamePhase["COMMAND_INPUT"] = "COMMAND_INPUT";
    GamePhase["RESOLUTION"] = "RESOLUTION";
    GamePhase["TURN_END"] = "TURN_END";
    GamePhase["GAME_OVER"] = "GAME_OVER";
})(GamePhase || (GamePhase = {}));
export class SisyphusGameOrchestrator {
    constructor(seed = Date.now()) {
        this.isRunning = false;
        this.isPaused = false;
        this.bus = new EventBus();
        this.validator = new SchemaValidator();
        this.fsmGuard = new FsmTransitionGuard();
        this.priorityQueue = new TurnPriorityQueue();
        this.backupStack = new StateBackupStack(5);
        this.watchdog = new CommandTimeoutWatchdog();
        this.resolutionMutex = new AsyncMutex();
        this.tickRate = new TickRateThrottler();
        this.errorBoundary = new LoopErrorBoundary();
        this.renderQueue = [];
        this.commandBuffer = [];
        this.tickCount = 0;
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
    async initialize(initialState) {
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
    validateInitialState() {
        const result = this.validator.validateRequired(this.state, {
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
    start() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        this.isPaused = false;
        this.state = { ...this.state, currentPhase: GamePhase.TURN_START };
        this.bus.emit("ENGINE_START", { turn: this.state.currentTurn }, "info");
        this.gameLoop();
    }
    pause() {
        this.isPaused = true;
        this.bus.emit("ENGINE_PAUSE", null, "info");
    }
    resume() {
        if (!this.isPaused)
            return;
        this.isPaused = false;
        this.bus.emit("ENGINE_RESUME", { turn: this.state.currentTurn }, "info");
        if (!this.isRunning) {
            this.isRunning = true;
            this.gameLoop();
        }
    }
    submitCommand(factionId, command) {
        if (this.state.currentPhase !== GamePhase.COMMAND_INPUT) {
            throw new Error(`명령은 COMMAND_INPUT 단계에서만 가능. 현재: ${this.state.currentPhase}`);
        }
        this.commandBuffer.push({ factionId, command });
        this.watchdog.markSubmitted(factionId);
    }
    async gameLoop() {
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
            if (this.errorBoundary.hasTooManyErrors)
                break;
            await this.tickRate.delay();
            this.tickCount++;
        }
    }
    async handleTurnStart() {
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
    async handleCommandInput() {
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
    async handleResolution() {
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
        }
        finally {
            this.resolutionMutex.release();
        }
    }
    async handleTurnEnd() {
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
    emitPhaseChange(to) {
        const from = this.state.currentPhase;
        this.fsmGuard.validateOrThrow(from, to);
        this.state = { ...this.state, currentPhase: to };
        this.bus.emit("PHASE_CHANGED", { from, to }, "info");
    }
    executeCommand(factionId, _command) {
        const factionExists = this.state.factions.has(factionId);
        if (!factionExists)
            return null;
        return {
            type: "FACTION_ACTION",
            payload: { factionId, timestamp: Date.now() },
        };
    }
    subscribe(eventType, listener) {
        return this.bus.subscribe(eventType, listener);
    }
    getState() {
        return freezeState({
            ...this.state,
            rngState: this.rng.getState(),
            renderQueue: [...this.renderQueue],
        });
    }
    setSpeed(speed) {
        this.tickRate.setSpeed(speed);
        this.bus.emit("SPEED_CHANGED", { speed }, "info");
    }
    async loadSave(data) {
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
    exportSave() {
        const snapshot = deepClone({
            ...this.state,
            renderQueue: [],
        });
        return JSON.stringify(snapshot);
    }
    get calendar() {
        return this.state.calendar;
    }
}
//# sourceMappingURL=sisyphus_orchestrator.js.map