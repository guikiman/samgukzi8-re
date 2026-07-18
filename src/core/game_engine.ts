/**
 * 삼국지 8 리메이크 — 통합 게임 엔진 (FSM 오케스트레이터)
 * 파일: src/core/game_engine.ts
 *
 * 모든 시스템을 통합하는 중앙 오케스트레이터
 * 유한 상태 머신 (FSM) 기반 페이즈 전환
 * 커맨드 큐 + 턴 스케줄러 + AI 워커 통합
 */

import {
    GamePhase, PhaseTransition, GlobalState, NormalizedState,
    Officer, Faction, City, Army, OfficerID, CityID,
    ICommand, CommandResult, CommandContext, SerializedCommand,
    AIDecision, SchedulerProgress,
    GameEvent, EventListener, WorkerRequest, WorkerResponse,
    AIWorkerPayload, AIWorkerResult,
} from './types.js';
import { GameStore, gameStore } from './game_store.js';
import { CommandQueue, DomesticCommand, TrainingCommand, RecruitmentCommand, MovementCommand, RestCommand, deserializeCommand } from './command_system.js';
import { TurnScheduler, AITurnProcessor, TurnLifecycleManager } from './turn_scheduler.js';
import { BootstrapContext, getBootstrap } from './bootstrap.js';

type PhaseEnterHandler = () => void | Promise<void>;
type PhaseExitHandler = () => void;

interface FSMStateConfig {
    onEnter?: PhaseEnterHandler;
    onExit?: PhaseExitHandler;
    transitions: Record<string, GamePhase>;
}

export class GameEngine {
    private store: GameStore;
    private commandQueue: CommandQueue;
    private scheduler: TurnScheduler;
    private aiProcessor: AITurnProcessor;
    private lifecycleManager: TurnLifecycleManager;
    private fsm: Record<GamePhase, FSMStateConfig>;
    private currentPhase: GamePhase;
    private phaseHistory: PhaseTransition[];
    private eventListeners: Map<string, Set<EventListener>>;
    private eventQueue: GameEvent[];
    private worker: Worker | null = null;
    private workerPromises: Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void }>;
    private bootstrap: BootstrapContext | null = null;
    private isProcessingTurn = false;

    constructor(store?: GameStore) {
        this.store = store ?? gameStore;
        this.commandQueue = new CommandQueue(200);
        this.aiProcessor = new AITurnProcessor(this.store, 50);
        this.scheduler = new TurnScheduler(async (task) => {
            await this.aiProcessor.processSingleOfficer(task.officerId);
        }, { chunkSize: 50 });
        this.lifecycleManager = new TurnLifecycleManager(this.store);
        this.currentPhase = GamePhase.TITLE;
        this.phaseHistory = [];
        this.eventListeners = new Map();
        this.eventQueue = [];
        this.workerPromises = new Map();

        this.fsm = this.buildFSM();
        this.initWorker();
        this.initBootstrap();
    }

    private initBootstrap(): void {
        this.bootstrap = getBootstrap();
        this.bootstrap.initializeEngine(this);
    }

    private buildFSM(): Record<GamePhase, FSMStateConfig> {
        return {
            [GamePhase.TITLE]: {
                onEnter: () => console.log('[Engine] TITLE phase'),
                transitions: { START: GamePhase.WORLD_MAP },
            },
            [GamePhase.WORLD_MAP]: {
                onEnter: () => this.onEnterWorldMap(),
                onExit: () => console.log('[Engine] WORLD_MAP exit'),
                transitions: {
                    COUNCIL_START: GamePhase.COUNCIL,
                    BATTLE_START: GamePhase.BATTLE,
                    EVENT_TRIGGER: GamePhase.EVENT,
                    DIALOGUE: GamePhase.DIALOGUE,
                },
            },
            [GamePhase.COUNCIL]: {
                onEnter: () => this.onEnterCouncil(),
                onExit: () => console.log('[Engine] COUNCIL exit'),
                transitions: {
                    COUNCIL_END: GamePhase.PERSONAL_ACTION,
                    BATTLE_START: GamePhase.BATTLE,
                },
            },
            [GamePhase.PERSONAL_ACTION]: {
                onEnter: () => this.onEnterPersonalAction(),
                onExit: () => console.log('[Engine] PERSONAL_ACTION exit'),
                transitions: {
                    ACTION_END: GamePhase.WORLD_MAP,
                    BATTLE_START: GamePhase.BATTLE,
                    EVENT_TRIGGER: GamePhase.EVENT,
                },
            },
            [GamePhase.BATTLE]: {
                onEnter: () => this.onEnterBattle(),
                onExit: () => this.onExitBattle(),
                transitions: {
                    BATTLE_END: GamePhase.WORLD_MAP,
                    BATTLE_LOST: GamePhase.GAME_OVER,
                },
            },
            [GamePhase.DIALOGUE]: {
                onEnter: () => console.log('[Engine] DIALOGUE enter'),
                transitions: { DIALOGUE_END: GamePhase.WORLD_MAP },
            },
            [GamePhase.EVENT]: {
                onEnter: () => this.onEnterEvent(),
                onExit: () => console.log('[Engine] EVENT exit'),
                transitions: {
                    EVENT_END: GamePhase.WORLD_MAP,
                    DIALOGUE: GamePhase.DIALOGUE,
                    BATTLE_START: GamePhase.BATTLE,
                },
            },
            [GamePhase.GAME_OVER]: {
                onEnter: () => console.log('[Engine] GAME_OVER'),
                transitions: {},
            },
        };
    }

    transition(event: string): boolean {
        const currentConfig = this.fsm[this.currentPhase];
        const targetPhase = currentConfig.transitions[event];
        if (!targetPhase) {
            console.warn(`[Engine] Invalid: ${this.currentPhase} --[${event}]--> ?`);
            return false;
        }

        if (currentConfig.onExit) currentConfig.onExit();

        const transition: PhaseTransition = {
            from: this.currentPhase, to: targetPhase, event, timestamp: Date.now(),
        };
        this.phaseHistory.push(transition);
        this.currentPhase = targetPhase;
        this.store.setPhase(targetPhase);

        const targetConfig = this.fsm[targetPhase];
        if (targetConfig.onEnter) {
            const result = targetConfig.onEnter();
            if (result instanceof Promise) {
                result.catch(err => console.error('[Engine] onEnter error:', err));
            }
        }
        this.emitEvent({ id: `phase_${Date.now()}`, type: 'PHASE_CHANGE', payload: { from: transition.from, to: transition.to }, timestamp: Date.now(), turn: this.store.getGlobalState().turnCount });
        return true;
    }

    getCurrentPhase(): GamePhase { return this.currentPhase; }
    getPhaseHistory(): PhaseTransition[] { return [...this.phaseHistory]; }

    private onEnterWorldMap(): void {
        console.log('[Engine] WORLD_MAP enter');
        this.processWeatherEffect();
    }

    private async onEnterCouncil(): Promise<void> {
        console.log('[Engine] COUNCIL enter');
    }

    private onEnterPersonalAction(): void {
        console.log('[Engine] PERSONAL_ACTION enter');
        const playerOfficer = this.store.getGlobalState().selectedOfficerId;
        if (playerOfficer) {
            const officer = this.store.getOfficer(playerOfficer);
            if (officer) {
                console.log(`[Engine] Player: ${officer.name} (AP: ${officer.actionPoints})`);
            }
        }
    }

    private onEnterBattle(): void {
        console.log('[Engine] BATTLE enter');
        this.emitEvent({ id: `battle_${Date.now()}`, type: 'BATTLE_START', payload: {}, timestamp: Date.now(), turn: this.store.getGlobalState().turnCount });
    }

    private onExitBattle(): void {
        console.log('[Engine] BATTLE exit');
    }

    private onEnterEvent(): void {
        console.log('[Engine] EVENT enter');
        this.processEventQueue();
    }

    enqueueCommand(command: ICommand): void {
        this.commandQueue.enqueue(command);
        this.emitEvent({ id: `cmd_${Date.now()}`, type: 'COMMAND_ENQUEUE', payload: { cmdId: command.id, cmdType: command.type }, timestamp: Date.now(), turn: this.store.getGlobalState().turnCount });
    }

    executeNextCommand(): CommandResult | null {
        const context: CommandContext = { store: this.store, logger: (msg) => console.log(msg) };
        return this.commandQueue.executeNext(context);
    }

    executeAllCommands(): CommandResult[] {
        const context: CommandContext = { store: this.store, logger: (msg) => console.log(msg) };
        return this.commandQueue.executeAll(context);
    }

    undoLastCommand(): boolean {
        const context: CommandContext = { store: this.store, logger: (msg) => console.log(msg) };
        return this.commandQueue.undoLast(context);
    }

    redoLastCommand(): boolean {
        const context: CommandContext = { store: this.store, logger: (msg) => console.log(msg) };
        return this.commandQueue.redoLast(context);
    }

    canUndo(): boolean { return this.commandQueue.canUndo(); }
    canRedo(): boolean { return this.commandQueue.canRedo(); }
    getPendingCommandCount(): number { return this.commandQueue.getPendingCount(); }

    async executeTurn(onProgress?: (progress: SchedulerProgress) => void): Promise<void> {
        if (this.isProcessingTurn) {
            console.warn('[Engine] Turn already processing');
            return;
        }
        this.isProcessingTurn = true;

        try {
            const gs = this.store.getGlobalState();
            console.log(`[Engine] === Turn ${gs.turnCount} | ${gs.time.year}yr ${gs.time.month}mo ===`);

            this.resetTurnFlags();
            this.transition('COUNCIL_START');
            await this.delay(10);
            this.transition('COUNCIL_END');
            await this.delay(10);

            const decisions = await this.lifecycleManager.executeAITurn(onProgress);
            console.log(`[Engine] AI decisions: ${decisions.length}`);

            for (const decision of decisions) {
                this.convertDecisionToCommand(decision);
            }

            const results = this.executeAllCommands();
            const successCount = results.filter(r => r.success).length;
            console.log(`[Engine] Commands: ${successCount}/${results.length} ok`);

            this.processEventQueue();
            if (this.bootstrap) {
                this.bootstrap.processTurnStart();
            }
            this.processMonthlyMaintenance();
            this.store.advanceTime();
            console.log('[Engine] === Turn end ===');
        } finally {
            this.isProcessingTurn = false;
        }
    }

    private resetTurnFlags(): void {
        const officers = this.store.getAllOfficers();
        for (const officer of officers) {
            this.store.updateOfficer(officer.id, {
                hasActedThisTurn: false,
                actionPoints: officer.maxActionPoints,
            });
        }
    }

    private convertDecisionToCommand(decision: AIDecision): void {
        const officerId = decision.officerId;
        const turn = this.store.getGlobalState().turnCount;
        const payload = decision.payload;
        let command: ICommand | null = null;

        switch (decision.actionType) {
            case 'DOMESTIC':
                if (payload.cityId) {
                    command = new DomesticCommand(officerId, payload.cityId as CityID, (payload.facilityType as string) ?? 'FARM', turn);
                }
                break;
            case 'TRAINING':
                command = new TrainingCommand(officerId, (payload.statKey as 'leadership' | 'might' | 'intelligence' | 'politics' | 'charisma') ?? 'might', turn);
                break;
            case 'RECRUITMENT':
                if (payload.targetOfficerId) {
                    command = new RecruitmentCommand(officerId, payload.targetOfficerId as OfficerID, turn);
                }
                break;
            case 'MOVEMENT':
                if (payload.fromCityId && payload.toCityId) {
                    command = new MovementCommand(officerId, payload.fromCityId as CityID, payload.toCityId as CityID, turn);
                }
                break;
            case 'REST':
                command = new RestCommand(officerId, turn);
                break;
            default:
                command = new RestCommand(officerId, turn);
        }

        if (command) {
            this.enqueueCommand(command);
            this.store.updateOfficer(officerId, { hasActedThisTurn: true });
        }
    }

    private processMonthlyMaintenance(): void {
        const factions = this.store.getAllFactions();
        for (const faction of factions) {
            const cities = this.store.getCitiesByFaction(faction.id);
            const goldIncome = cities.reduce((sum, c) => sum + c.goldIncome, 0);
            const foodIncome = cities.reduce((sum, c) => sum + c.foodIncome, 0);
            this.store.updateFaction(faction.id, {
                gold: faction.gold + goldIncome,
                food: faction.food + foodIncome,
            });
        }

        const officers = this.store.getAllOfficers();
        const currentYear = this.store.getGlobalState().time.year;
        for (const officer of officers) {
            if (officer.deathYear && currentYear >= officer.deathYear) {
                console.log(`[Engine] ${officer.name} died (lifespan)`);
                const gs = this.store.getGlobalState();
                const age = currentYear - officer.birthYear;
                this.store.removeOfficer(officer.id);
                this.emitEvent({
                    id: `death_${officer.id}`,
                    type: 'OFFICER_DEATH',
                    payload: {
                        officerId: officer.id,
                        officerName: officer.name,
                        cause: 'OLD_AGE',
                        age,
                        year: currentYear,
                        turn: gs.turnCount,
                        factionId: officer.factionId,
                    },
                    timestamp: Date.now(),
                    turn: gs.turnCount,
                });
            }
        }
    }

    private processWeatherEffect(): void {
        const gs = this.store.getGlobalState();
        if (gs.weather === 'STORM' || gs.weather === 'SNOW') {
            console.log(`[Engine] Weather: ${gs.weather}`);
            const officers = this.store.getAllOfficers();
            for (const officer of officers) {
                this.store.updateOfficer(officer.id, {
                    stamina: Math.max(0, officer.stamina - 5),
                });
            }
        }
    }

    emitEvent(event: GameEvent): void {
        this.eventQueue.push(event);
        const listeners = this.eventListeners.get(event.type);
        if (listeners) {
            for (const listener of listeners) {
                listener(event);
            }
        }
    }

    subscribe(eventType: string, listener: EventListener): () => void {
        if (!this.eventListeners.has(eventType)) {
            this.eventListeners.set(eventType, new Set());
        }
        this.eventListeners.get(eventType)!.add(listener);
        return () => this.eventListeners.get(eventType)?.delete(listener);
    }

    private processEventQueue(): void {
        while (this.eventQueue.length > 0) {
            const event = this.eventQueue.shift();
            if (!event) continue;
            const listeners = this.eventListeners.get(event.type);
            if (listeners) {
                for (const listener of listeners) {
                    listener(event);
                }
            }
        }
    }

    getPendingEvents(): GameEvent[] { return [...this.eventQueue]; }

    private initWorker(): void {
        if (typeof Worker === 'undefined') {
            console.warn('[Engine] Web Worker not supported - fallback');
            return;
        }
        try {
            this.worker = new Worker(new URL('./ai_worker.ts', import.meta.url), { type: 'module' });
            this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
                const response = e.data;
                const pending = this.workerPromises.get(response.id);
                if (pending) {
                    if (response.success) {
                        pending.resolve(response.result);
                    } else {
                        pending.reject(new Error(response.error ?? 'Unknown worker error'));
                    }
                    this.workerPromises.delete(response.id);
                }
            };
            this.worker.onerror = (err) => {
                console.error('[Engine] Worker error:', err);
            };
        } catch (err) {
            console.warn('[Engine] Worker init failed, fallback:', err);
            this.worker = null;
        }
    }

    async requestAIWorker(payload: AIWorkerPayload): Promise<AIWorkerResult> {
        if (!this.worker) {
            return this.localAIProcessing(payload);
        }

        const request: WorkerRequest = {
            id: `ai_req_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            type: 'AI_DECISION',
            payload: payload as unknown as Record<string, unknown>,
        };

        return new Promise((resolve, reject) => {
            this.workerPromises.set(request.id, {
                resolve: (v) => resolve(v as AIWorkerResult),
                reject,
            });
            this.worker!.postMessage(request);
        });
    }

    private async localAIProcessing(payload: AIWorkerPayload): Promise<AIWorkerResult> {
        const decisions: AIDecision[] = [];
        for (const officerId of payload.officerIds) {
            const officer = payload.stateSnapshot.officers[officerId];
            if (!officer) continue;
            decisions.push({
                officerId,
                actionType: officer.actionPoints < 20 ? 'REST' : 'DOMESTIC',
                priority: 0.5,
                reasoning: 'Local fallback decision',
                payload: { cityId: officer.cityId ?? '' },
            });
        }
        return { decisions };
    }

    terminateWorker(): void {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        this.workerPromises.clear();
    }

    save(): { state: NormalizedState; globalState: GlobalState; commands: SerializedCommand[] } {
        return {
            state: this.store.createSnapshot(),
            globalState: this.store.getGlobalState(),
            commands: this.commandQueue.serializeAll(),
        };
    }

    saveCompressed(): string {
        if (this.bootstrap) {
            return this.bootstrap.prepareSave(this);
        }
        return JSON.stringify(this.save());
    }

    loadCompressed(compressed: string): boolean {
        if (this.bootstrap) {
            return this.bootstrap.loadFromSave(this, compressed);
        }
        try {
            const data = JSON.parse(compressed);
            this.load(data);
            return true;
        } catch {
            return false;
        }
    }

    load(data: { state: NormalizedState; globalState: GlobalState; commands: SerializedCommand[] }): void {
        this.store.restoreSnapshot(data.state);
        this.store.setGlobalState(data.globalState);
        this.commandQueue.clear();
        for (const cmdData of data.commands) {
            this.commandQueue.enqueue(deserializeCommand(cmdData));
        }
        console.log('[Engine] Save loaded');
    }

    initWorld(officers: Officer[], factions: Faction[], cities: City[], armies: Army[]): void {
        this.store.initWorld(officers, factions, cities, armies);
        this.transition('START');
        console.log('[Engine] World initialized');
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

let engineInstance: GameEngine | null = null;

export function getGameEngine(): GameEngine {
    if (!engineInstance) engineInstance = new GameEngine();
    return engineInstance;
}
