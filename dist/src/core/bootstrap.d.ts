/**
 * [Tasks 1~520] Bootstrap — 통합 시스템 초기화 및 게임 엔진 연동
 *
 * 27개 신규 모듈을 GameEngine에 주입하고,
 * 턴 라이프사이클 및 이벤트 기반으로 연결.
 */
import type { GameEngine } from './game_engine.js';
import { StatModifierCalculator } from './stat_modifier_calculator.js';
import { GraveyardStore } from './graveyard_store.js';
import { relationTypeToBitmask, bitmaskToRelationTypes, hasRelation, addRelation, removeRelation, combineMasks } from './relation_bitmask.js';
import { AffinityDecaySystem } from './affinity_decay_system.js';
import { EdgeWeightAtomic } from './edge_weight_atomic.js';
import { InteractionRingBuffer } from './interaction_ring_buffer.js';
import { EmotionalContagion } from './emotional_contagion.js';
import { AdoptionSystem } from './adoption_system.js';
import { ClanHonorStore, ClanRank } from './clan_honor_store.js';
import { FactionClustering } from './faction_clustering.js';
import { ChildhoodVirtualizer } from './childhood_virtualizer.js';
import { OfficerBuilder, createDefaultOfficer } from './officer_factory.js';
import { ImmerPipeline } from './immer_pipeline.js';
import { StateDebounceManager } from './state_debounce.js';
import { ChunkedSavePipeline } from './chunked_save_pipeline.js';
import { SaveCompressor } from './save_compressor.js';
import { NetworkLatencySimulator } from './network_latency_simulator.js';
import { WorkerTimeoutWatchdog } from './worker_timeout_watchdog.js';
import { WorkerMemoryOptimizer } from './worker_memory_optimizer.js';
import { WorkerErrorRecovery } from './worker_error_recovery.js';
import { WorkerLogAggregator } from './worker_log_aggregator.js';
import { WorkerMemoryDiagnostics } from './worker_memory_diagnostics.js';
import { RelationshipGraphViewer } from './relationship_graph_viewer.js';
import { TargetedRerenderSelector } from './targeted_rerender_selector.js';
import { MemoryLeakTracer } from './memory_leak_tracer.js';
import { StressTestRunner } from './stress_test_runner.js';
export { StatModifierCalculator, GraveyardStore, relationTypeToBitmask, bitmaskToRelationTypes, hasRelation, addRelation, removeRelation, combineMasks, AffinityDecaySystem, EdgeWeightAtomic, InteractionRingBuffer, EmotionalContagion, AdoptionSystem, ClanHonorStore, ClanRank, FactionClustering, ChildhoodVirtualizer, OfficerBuilder, createDefaultOfficer, ImmerPipeline, StateDebounceManager, ChunkedSavePipeline, SaveCompressor, NetworkLatencySimulator, WorkerTimeoutWatchdog, WorkerMemoryOptimizer, WorkerErrorRecovery, WorkerLogAggregator, WorkerMemoryDiagnostics, RelationshipGraphViewer, TargetedRerenderSelector, MemoryLeakTracer, StressTestRunner, };
export declare class BootstrapContext {
    readonly statModifier: StatModifierCalculator;
    readonly graveyard: GraveyardStore;
    readonly affinityDecay: AffinityDecaySystem;
    readonly edgeWeight: EdgeWeightAtomic;
    readonly interactionBuffer: InteractionRingBuffer;
    readonly emotionalContagion: EmotionalContagion;
    readonly adoption: AdoptionSystem;
    readonly clanHonor: ClanHonorStore;
    readonly factionClustering: FactionClustering;
    readonly childhoodVirtualizer: ChildhoodVirtualizer;
    readonly immer: ImmerPipeline;
    readonly stateDebounce: StateDebounceManager;
    readonly chunkedSave: ChunkedSavePipeline;
    readonly saveCompressor: SaveCompressor;
    readonly networkLatency: NetworkLatencySimulator;
    readonly workerTimeout: WorkerTimeoutWatchdog;
    readonly workerMemoryOpt: WorkerMemoryOptimizer;
    readonly workerErrorRecovery: WorkerErrorRecovery;
    readonly workerLog: WorkerLogAggregator;
    readonly workerMemoryDiag: WorkerMemoryDiagnostics;
    readonly graphViewer: RelationshipGraphViewer;
    readonly rerenderSelector: TargetedRerenderSelector;
    readonly leakTracer: MemoryLeakTracer;
    readonly stressTest: StressTestRunner;
    private engine;
    private cleanupFns;
    private turnBound;
    constructor();
    initializeEngine(engine: GameEngine): void;
    private bindTurnLifecycle;
    processTurnStart(): void;
    private bindEventHooks;
    private setupWorkerErrorHandling;
    prepareSave(engine: GameEngine): string;
    loadFromSave(engine: GameEngine, compressed: string): boolean;
    private subscribeEngine;
    private logSystemStatus;
    shutdown(): void;
}
export declare function getBootstrap(): BootstrapContext;
export declare function resetBootstrap(): void;
//# sourceMappingURL=bootstrap.d.ts.map