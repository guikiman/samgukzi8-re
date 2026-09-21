/**
 * 삼국지 8 리메이크 — 통합 게임 엔진 (FSM 오케스트레이터)
 * 파일: src/core/game_engine.ts
 *
 * 모든 시스템을 통합하는 중앙 오케스트레이터
 * 유한 상태 머신 (FSM) 기반 페이즈 전환
 * 커맨드 큐 + 턴 스케줄러 + AI 워커 통합
 */
import { GamePhase, PhaseTransition, GlobalState, NormalizedState, Officer, Faction, City, Army, ICommand, CommandResult, SerializedCommand, SchedulerProgress, GameEvent, EventListener, AIWorkerPayload, AIWorkerResult } from './types.js';
import { GameStore } from './game_store.js';
export declare class GameEngine {
    private store;
    private commandQueue;
    private scheduler;
    private aiProcessor;
    private lifecycleManager;
    private fsm;
    private currentPhase;
    private phaseHistory;
    private eventListeners;
    private eventQueue;
    private worker;
    private workerPromises;
    private bootstrap;
    private factionAI;
    private fateSystem;
    private loyaltySystem;
    private isProcessingTurn;
    constructor(store?: GameStore);
    private initBootstrap;
    private buildFSM;
    transition(event: string): boolean;
    getCurrentPhase(): GamePhase;
    getPhaseHistory(): PhaseTransition[];
    private onEnterWorldMap;
    private onEnterCouncil;
    private onEnterPersonalAction;
    private onEnterBattle;
    private onExitBattle;
    private onEnterEvent;
    enqueueCommand(command: ICommand): void;
    executeNextCommand(): CommandResult | null;
    executeAllCommands(): CommandResult[];
    undoLastCommand(): boolean;
    redoLastCommand(): boolean;
    canUndo(): boolean;
    canRedo(): boolean;
    getPendingCommandCount(): number;
    executeTurn(onProgress?: (progress: SchedulerProgress) => void): Promise<void>;
    private resetTurnFlags;
    private convertDecisionToCommand;
    private processMonthlyMaintenance;
    private processWeatherEffect;
    emitEvent(event: GameEvent): void;
    subscribe(eventType: string, listener: EventListener): () => void;
    private processEventQueue;
    getPendingEvents(): GameEvent[];
    private initWorker;
    requestAIWorker(payload: AIWorkerPayload): Promise<AIWorkerResult>;
    private localAIProcessing;
    terminateWorker(): void;
    save(): {
        state: NormalizedState;
        globalState: GlobalState;
        commands: SerializedCommand[];
    };
    saveCompressed(): string;
    loadCompressed(compressed: string): boolean;
    load(data: {
        state: NormalizedState;
        globalState: GlobalState;
        commands: SerializedCommand[];
    }): void;
    initWorld(officers: Officer[], factions: Faction[], cities: City[], armies: Army[]): void;
    private delay;
}
export declare function getGameEngine(): GameEngine;
//# sourceMappingURL=game_engine.d.ts.map