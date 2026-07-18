import { NormalizedState, Officer, Faction, City, Army, RelationshipEdge, OfficerID, CommandType } from './types.js';
import { GameStore } from './game_store.js';
export interface StateDelta {
    readonly officers: Record<string, Partial<Officer> | null>;
    readonly factions: Record<string, Partial<Faction> | null>;
    readonly cities: Record<string, Partial<City> | null>;
    readonly armies: Record<string, Partial<Army> | null>;
    readonly relationships: Record<string, RelationshipEdge | null>;
    readonly turnCount: number;
    readonly timestamp: number;
}
export interface CompressedSaveBlob {
    readonly version: number;
    readonly turnCount: number;
    readonly gameTime: {
        year: number;
        month: number;
    };
    readonly compressed: string;
    readonly checksum: string;
    readonly parentChecksum: string | null;
    readonly metadata: {
        readonly label: string;
        readonly timestamp: number;
        readonly compressedSizeBytes: number;
        readonly originalSizeBytes: number;
    };
}
export interface TimeMachineNode {
    readonly id: string;
    readonly turnCount: number;
    readonly gameTime: {
        year: number;
        month: number;
    };
    readonly label: string;
    readonly timestamp: number;
    readonly delta: StateDelta;
    readonly fullSnapshot?: NormalizedState;
    readonly commandSummary: string;
    readonly checksum: string;
}
export interface RollbackResult {
    success: boolean;
    restoredTurnCount: number;
    restoredTime: {
        year: number;
        month: number;
    };
    commandsRolledBack: number;
    message: string;
}
export interface BackupStats {
    totalSnapshots: number;
    totalDeltas: number;
    totalCompressedBytes: number;
    totalOriginalBytes: number;
    compressionRatio: number;
    oldestTurn: number;
    newestTurn: number;
    memoryUsageBytes: number;
}
export declare class DeltaEngine {
    computeDelta(current: NormalizedState, previous: NormalizedState): StateDelta;
    applyDelta(base: NormalizedState, delta: StateDelta): NormalizedState;
    estimateDeltaSize(delta: StateDelta): number;
    static emptyState(): NormalizedState;
}
export declare class CompressionCodec {
    private static readonly MIN_MATCH;
    private static readonly MAX_MATCH;
    private static readonly WINDOW_SIZE;
    private static readonly BASE64_CHARS;
    private static readonly BASE64_MAP;
    compress(data: string): string;
    decompress(compressed: string): string;
    estimateRatio(original: string): number;
    private lz77Compress;
    private lz77Decompress;
    private tokensToBytes;
    private bytesToTokens;
    static base64Encode(bytes: Uint8Array): string;
    static base64Decode(str: string): Uint8Array;
    private stringToCodeUnits;
    private codeUnitsToString;
}
export declare class TimeMachine {
    private nodes;
    private currentIndex;
    private readonly maxNodes;
    private readonly fullSnapshotInterval;
    private baseSnapshot;
    private baseTurnCount;
    private readonly deltaEngine;
    private readonly codec;
    constructor(maxNodes?: number, fullSnapshotInterval?: number);
    recordSnapshot(store: GameStore, label: string, commands: readonly {
        type: CommandType;
        officerId: OfficerID;
        description: string;
    }[]): void;
    undo(store: GameStore): RollbackResult;
    redo(store: GameStore): RollbackResult;
    rollbackToSnapshot(store: GameStore, targetTurn: number): RollbackResult;
    exportCompressedSave(store: GameStore, label: string): CompressedSaveBlob;
    importCompressedSave(store: GameStore, blob: CompressedSaveBlob): boolean;
    persistToLocalStorage(slot?: number): boolean;
    loadFromLocalStorage(slot?: number): boolean;
    clearAllSlots(): void;
    compact(keepRatio?: number): void;
    canUndo(): boolean;
    canRedo(): boolean;
    getCurrentTurn(): number;
    getHistoryLength(): number;
    getHistorySummary(): {
        turn: number;
        label: string;
        timestamp: number;
        isCheckpoint: boolean;
    }[];
    getStats(): BackupStats;
    dispose(): void;
    private restoreAtCurrentIndex;
    private rebuildFromStart;
    private enforceMaxNodes;
    private trimRedoHistory;
    private computeChecksum;
}
export declare class GameStateBackupManager {
    readonly deltaEngine: DeltaEngine;
    readonly codec: CompressionCodec;
    readonly timeMachine: TimeMachine;
    private store;
    private autoSaveInterval;
    private lastAutoSaveTurn;
    private autoSaveSlot;
    constructor(autoSaveInterval?: number);
    initialize(store: GameStore): void;
    recordSnapshot(label: string, commands?: readonly {
        type: CommandType;
        officerId: OfficerID;
        description: string;
    }[]): void;
    undo(): RollbackResult;
    redo(): RollbackResult;
    rollbackToSnapshot(targetTurn: number): RollbackResult;
    exportCompressedSave(label: string): CompressedSaveBlob | null;
    importCompressedSave(blob: CompressedSaveBlob): boolean;
    persistToLocalStorage(slot?: number): boolean;
    loadFromLocalStorage(slot?: number): boolean;
    compact(keepRatio?: number): void;
    getStats(): BackupStats;
    canUndo(): boolean;
    canRedo(): boolean;
    getHistorySummary(): ReturnType<TimeMachine['getHistorySummary']>;
    dispose(): void;
}
//# sourceMappingURL=game_state_backup_manager.d.ts.map