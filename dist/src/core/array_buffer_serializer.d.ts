import type { GameState } from "./sisyphus_orchestrator";
export declare enum FieldType {
    UINT8 = 0,
    INT32 = 1,
    UINT32 = 2,
    FLOAT32 = 3,
    STRING = 4,
    BOOL = 5
}
export interface BinaryLayout {
    fields: Array<{
        key: string;
        type: FieldType;
    }>;
    arrayFields: Array<{
        key: string;
        itemType: FieldType;
    }>;
}
export declare function classifyState(state: GameState): BinaryLayout;
export declare function serializeStateToBuffer(state: GameState): ArrayBuffer;
export declare function deserializeStateFromBuffer(buffer: ArrayBuffer): GameState;
export declare function estimateBinarySize(state: GameState): number;
//# sourceMappingURL=array_buffer_serializer.d.ts.map