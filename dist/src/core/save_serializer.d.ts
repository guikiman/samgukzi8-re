import { GameState, SisyphusGameOrchestrator } from "./sisyphus_orchestrator";
export interface SaveHeader {
    readonly version: number;
    readonly timestamp: number;
    readonly turn: number;
    readonly date: string;
    readonly checksum: number;
}
export interface SaveData {
    readonly header: SaveHeader;
    readonly state: unknown;
}
export declare class SaveSerializer {
    private readonly version;
    serialize(orchestrator: SisyphusGameOrchestrator): string;
    deserialize(data: string): {
        header: SaveHeader;
        state: GameState;
    };
    validateSave(data: string): {
        valid: boolean;
        error?: string;
    };
}
//# sourceMappingURL=save_serializer.d.ts.map