/**
 * [E48] 에셋 청크 분할 로더 — AssetChunkLoader
 *
 * 목적: 대용량 맵/텍스처를 청크 단위로 분할 로드하여
 *       초기 로딩 시간 단축 및 메모리 사용 최적화.
 *
 * 핵심 로직:
 *   1. 청크 우선순위 큐 (가시 영역 우선)
 *   2. 점진적 로드 + 진행률 콜백
 */
export interface AssetChunk {
    readonly id: string;
    readonly url: string;
    readonly priority: number;
    readonly size: number;
}
export interface ChunkLoadProgress {
    readonly loaded: number;
    readonly total: number;
    readonly percent: number;
    readonly currentChunk: string;
}
export declare class AssetChunkLoader {
    private queue;
    private loading;
    private loadedChunks;
    private onProgress;
    /** 청크 등록 */
    addChunk(chunk: AssetChunk): void;
    /** 여러 청크 등록 */
    addChunks(chunks: AssetChunk[]): void;
    /** 진행률 콜백 등록 */
    setProgressCallback(cb: (progress: ChunkLoadProgress) => void): void;
    /** 청크 로드 시작 */
    loadAll(concurrency?: number): Promise<void>;
    /** 특정 청크 로드 */
    private loadChunk;
    private chunkCache;
    /** 청크 URL 조회 */
    getChunkUrl(id: string): string | undefined;
    /** 청크 로드 완료 여부 */
    isLoaded(id: string): boolean;
    /** 진행률 보고 */
    private reportProgress;
    /** 모든 캐시 초기화 */
    clearCache(): void;
}
//# sourceMappingURL=asset_chunk_loader.d.ts.map