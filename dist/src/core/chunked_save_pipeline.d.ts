/**
 * [Task 53] 청크 단위 분할 저장 — ChunkedSavePipeline
 *
 * 큰 세이브 데이터를 청크로 분할하여 저장/로드.
 */
export interface ChunkMetadata {
    readonly chunkIndex: number;
    readonly totalChunks: number;
    readonly chunkSize: number;
    readonly totalSize: number;
    readonly checksum: number;
}
export interface ChunkData {
    readonly metadata: ChunkMetadata;
    readonly data: string;
}
export declare class ChunkedSavePipeline {
    private readonly maxChunkSize;
    constructor(maxChunkSize?: number);
    split(data: string): ChunkData[];
    merge(chunks: ChunkData[]): string;
    validate(chunks: ChunkData[]): {
        valid: boolean;
        errors: string[];
    };
    getChunkCount(data: string): number;
    private simpleHash;
}
//# sourceMappingURL=chunked_save_pipeline.d.ts.map