/**
 * [Tasks 1~520] Bootstrap — 통합 시스템 초기화 및 게임 엔진 연동
 *
 * 27개 신규 모듈을 GameEngine에 주입하고,
 * 턴 라이프사이클 및 이벤트 기반으로 연결.
 */

import type { GameEngine } from './game_engine.js';
import type { OfficerID, OfficerStats, OfficerExp, Personality } from './types.js';

// Phase 1 (People/Relations)
import { StatModifierCalculator } from './stat_modifier_calculator.js';
import { GraveyardStore, DeathCause } from './graveyard_store.js';
import {
    relationTypeToBitmask, bitmaskToRelationTypes, hasRelation,
    addRelation, removeRelation, combineMasks,
} from './relation_bitmask.js';
import { AffinityDecaySystem } from './affinity_decay_system.js';
import { EdgeWeightAtomic } from './edge_weight_atomic.js';
import { InteractionRingBuffer } from './interaction_ring_buffer.js';
import { EmotionalContagion } from './emotional_contagion.js';
import { AdoptionSystem } from './adoption_system.js';
import { ClanHonorStore, ClanRank } from './clan_honor_store.js';
import { FactionClustering } from './faction_clustering.js';
import { ChildhoodVirtualizer } from './childhood_virtualizer.js';
import { OfficerBuilder, createDefaultOfficer } from './officer_factory.js';

// Phase 4 (State/Async)
import { ImmerPipeline } from './immer_pipeline.js';
import { StateDebounceManager } from './state_debounce.js';
import { ChunkedSavePipeline } from './chunked_save_pipeline.js';
import { SaveCompressor } from './save_compressor.js';
import { NetworkLatencySimulator } from './network_latency_simulator.js';

// Phase 5 (Worker/Debug)
import { WorkerTimeoutWatchdog } from './worker_timeout_watchdog.js';
import { WorkerMemoryOptimizer } from './worker_memory_optimizer.js';
import { WorkerErrorRecovery } from './worker_error_recovery.js';
import { WorkerLogAggregator } from './worker_log_aggregator.js';
import { WorkerMemoryDiagnostics } from './worker_memory_diagnostics.js';
import { RelationshipGraphViewer } from './relationship_graph_viewer.js';
import { TargetedRerenderSelector } from './targeted_rerender_selector.js';
import { MemoryLeakTracer } from './memory_leak_tracer.js';
import { StressTestRunner } from './stress_test_runner.js';

export {
    StatModifierCalculator, GraveyardStore,
    relationTypeToBitmask, bitmaskToRelationTypes, hasRelation,
    addRelation, removeRelation, combineMasks,
    AffinityDecaySystem, EdgeWeightAtomic, InteractionRingBuffer,
    EmotionalContagion, AdoptionSystem, ClanHonorStore, ClanRank,
    FactionClustering, ChildhoodVirtualizer, OfficerBuilder, createDefaultOfficer,
    ImmerPipeline, StateDebounceManager, ChunkedSavePipeline, SaveCompressor,
    NetworkLatencySimulator,
    WorkerTimeoutWatchdog, WorkerMemoryOptimizer, WorkerErrorRecovery,
    WorkerLogAggregator, WorkerMemoryDiagnostics, RelationshipGraphViewer,
    TargetedRerenderSelector, MemoryLeakTracer, StressTestRunner,
};

export class BootstrapContext {
    // Phase 1
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

    // Phase 4
    readonly immer: ImmerPipeline;
    readonly stateDebounce: StateDebounceManager;
    readonly chunkedSave: ChunkedSavePipeline;
    readonly saveCompressor: SaveCompressor;
    readonly networkLatency: NetworkLatencySimulator;

    // Phase 5
    readonly workerTimeout: WorkerTimeoutWatchdog;
    readonly workerMemoryOpt: WorkerMemoryOptimizer;
    readonly workerErrorRecovery: WorkerErrorRecovery;
    readonly workerLog: WorkerLogAggregator;
    readonly workerMemoryDiag: WorkerMemoryDiagnostics;
    readonly graphViewer: RelationshipGraphViewer;
    readonly rerenderSelector: TargetedRerenderSelector;
    readonly leakTracer: MemoryLeakTracer;
    readonly stressTest: StressTestRunner;

    private engine: GameEngine | null = null;
    private cleanupFns: Array<() => void> = [];
    private turnBound = false;

    constructor() {
        this.statModifier = new StatModifierCalculator();
        this.graveyard = new GraveyardStore();
        this.affinityDecay = new AffinityDecaySystem();
        this.edgeWeight = new EdgeWeightAtomic();
        this.interactionBuffer = new InteractionRingBuffer(5000);
        this.emotionalContagion = new EmotionalContagion();
        this.adoption = new AdoptionSystem();
        this.clanHonor = new ClanHonorStore();
        this.factionClustering = new FactionClustering();
        this.childhoodVirtualizer = new ChildhoodVirtualizer();

        this.immer = new ImmerPipeline();
        this.stateDebounce = new StateDebounceManager({ windowMs: 100, maxBatchSize: 50 });
        this.chunkedSave = new ChunkedSavePipeline();
        this.saveCompressor = new SaveCompressor();
        this.networkLatency = new NetworkLatencySimulator();

        this.workerTimeout = new WorkerTimeoutWatchdog();
        this.workerMemoryOpt = new WorkerMemoryOptimizer();
        this.workerErrorRecovery = new WorkerErrorRecovery();
        this.workerLog = new WorkerLogAggregator(10000);
        this.workerMemoryDiag = new WorkerMemoryDiagnostics();
        this.graphViewer = new RelationshipGraphViewer();
        this.rerenderSelector = new TargetedRerenderSelector();
        this.leakTracer = new MemoryLeakTracer();
        this.stressTest = new StressTestRunner();
    }

    initializeEngine(engine: GameEngine): void {
        this.engine = engine;
        this.bindTurnLifecycle();
        this.bindEventHooks();
        this.setupWorkerErrorHandling();
        this.logSystemStatus('INITIALIZED');
    }

    // ============================================================
    // Turn lifecycle
    // ============================================================

    private bindTurnLifecycle(): void {
        if (this.turnBound) return;
        this.turnBound = true;

        const unsubTurn = this.subscribeEngine('TURN_START', () => {
            this.processTurnStart();
        });
        if (unsubTurn) this.cleanupFns.push(unsubTurn);

        const unsubDeath = this.subscribeEngine('OFFICER_DEATH', (event: any) => {
            const officerId = event.payload.officerId as OfficerID;
            this.graveyard.bury(
                officerId,
                (event.payload.officerName as string) ?? 'Unknown',
                { leadership: 0, might: 0, intelligence: 0, politics: 0, charisma: 0 },
                (event.payload.factionId as string) ?? null,
                (event.payload.year as number) ?? 0,
                (event.payload.turn as number) ?? 0,
                (event.payload.cause as DeathCause) ?? 'BATTLE' as DeathCause,
                (event.payload.age as number) ?? 30,
            );
        });
        if (unsubDeath) this.cleanupFns.push(unsubDeath);

        const unsubBattle = this.subscribeEngine('BATTLE_RESULT', (event: any) => {
            const source = event.payload.attackerId as OfficerID;
            const target = event.payload.defenderId as OfficerID;
            this.interactionBuffer.push({
                sourceId: source,
                targetId: target,
                type: 'BATTLE_TOGETHER',
                affinityDelta: (event.payload.affinityDelta as number) ?? 5,
                turn: (event.payload.turn as number) ?? 0,
                year: (event.payload.year as number) ?? 0,
                month: (event.payload.month as number) ?? 1,
                description: `Battle: ${(event.payload.battleName as string) ?? ''}`,
            });
        });
        if (unsubBattle) this.cleanupFns.push(unsubBattle);
    }

    processTurnStart(): void {
        this.emotionalContagion.decayAll();
        this.leakTracer.takeSnapshot();
    }

    // ============================================================
    // Event hooks
    // ============================================================

    private bindEventHooks(): void {
        const unsubFlush = this.subscribeEngine('PHASE_CHANGE', () => {
            this.stateDebounce.flush();
        });
        if (unsubFlush) this.cleanupFns.push(unsubFlush);

        setInterval(() => {
            this.workerMemoryDiag.takeSample();
            const report = this.workerMemoryDiag.getReport();
            if (report.isLeaking) {
                this.workerLog.warn('bootstrap',
                    'Memory leak detected', 0,
                    { growthRate: report.growthRate, peakMemory: report.peakMemory },
                );
            }
        }, 60000);
    }

    // ============================================================
    // Worker error recovery
    // ============================================================

    private setupWorkerErrorHandling(): void {
        this.workerTimeout.setTimeoutMs(30000);
    }

    // ============================================================
    // Save/Load helpers
    // ============================================================

    prepareSave(engine: GameEngine): string {
        const saveData = engine.save();
        const serialized = JSON.stringify(saveData);
        const chunks = this.chunkedSave.split(serialized);
        const compressed = this.saveCompressor.compress(chunks.map(c => c.data).join('||'));
        return compressed;
    }

    loadFromSave(engine: GameEngine, compressed: string): boolean {
        try {
            const decompressed = this.saveCompressor.decompress(compressed);
            if (!decompressed) return false;
            const data = JSON.parse(decompressed);
            engine.load(data);
            return true;
        } catch {
            return false;
        }
    }

    // ============================================================
    // Utilities
    // ============================================================

    private subscribeEngine(eventType: string, handler: (event: any) => void): (() => void) | null {
        if (!this.engine) return null;
        try {
            return this.engine.subscribe(eventType, handler);
        } catch {
            return null;
        }
    }

    private logSystemStatus(status: string): void {
        const subsystems = [
            'statModifier', 'graveyard', 'affinityDecay', 'edgeWeight',
            'interactionBuffer', 'emotionalContagion', 'adoption', 'clanHonor',
            'factionClustering', 'childhoodVirtualizer',
            'immer', 'stateDebounce', 'chunkedSave', 'saveCompressor',
            'networkLatency', 'workerTimeout', 'workerMemoryOpt',
            'workerErrorRecovery', 'workerLog', 'workerMemoryDiag',
            'graphViewer', 'rerenderSelector', 'leakTracer', 'stressTest',
        ];
        console.log(`[Bootstrap] ${status} — ${subsystems.length} subsystems ready`);
    }

    shutdown(): void {
        for (const fn of this.cleanupFns) {
            try { fn(); } catch { /* ignore */ }
        }
        this.cleanupFns = [];
        this.engine = null;
        this.turnBound = false;
        this.logSystemStatus('SHUTDOWN');
    }
}

let bootstrapInstance: BootstrapContext | null = null;

export function getBootstrap(): BootstrapContext {
    if (!bootstrapInstance) bootstrapInstance = new BootstrapContext();
    return bootstrapInstance;
}

export function resetBootstrap(): void {
    if (bootstrapInstance) {
        bootstrapInstance.shutdown();
        bootstrapInstance = null;
    }
}
