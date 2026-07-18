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
    readonly priority: number; // 낮을수록 우선
    readonly size: number;     // bytes
}

export interface ChunkLoadProgress {
    readonly loaded: number;
    readonly total: number;
    readonly percent: number;
    readonly currentChunk: string;
}

export class AssetChunkLoader {
    private queue: AssetChunk[] = [];
    private loading = false;
    private loadedChunks: Set<string> = new Set();
    private onProgress: ((progress: ChunkLoadProgress) => void) | null = null;

    /** 청크 등록 */
    addChunk(chunk: AssetChunk): void {
        this.queue.push(chunk);
        this.queue.sort((a, b) => a.priority - b.priority);
    }

    /** 여러 청크 등록 */
    addChunks(chunks: AssetChunk[]): void {
        this.queue.push(...chunks);
        this.queue.sort((a, b) => a.priority - b.priority);
    }

    /** 진행률 콜백 등록 */
    setProgressCallback(cb: (progress: ChunkLoadProgress) => void): void {
        this.onProgress = cb;
    }

    /** 청크 로드 시작 */
    async loadAll(concurrency = 4): Promise<void> {
        if (this.loading) return;
        this.loading = true;

        const total = this.queue.length;
        let loaded = 0;

        // 동시성 제한 배치 처리
        while (this.queue.length > 0) {
            const batch = this.queue.splice(0, concurrency);
            await Promise.all(
                batch.map(async (chunk) => {
                    try {
                        await this.loadChunk(chunk);
                        this.loadedChunks.add(chunk.id);
                    } catch {
                        // 실패한 청크는 재시도 큐에 추가
                        this.queue.push(chunk);
                    }
                })
            );

            loaded += batch.length;
            this.reportProgress(loaded, total, batch[batch.length - 1]?.id ?? '');
        }

        this.loading = false;
    }

    /** 특정 청크 로드 */
    private async loadChunk(chunk: AssetChunk): Promise<void> {
        const response = await fetch(chunk.url);
        if (!response.ok) throw new Error(`Failed to load chunk: ${chunk.id}`);

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        // 청크 데이터를 캐시에 저장
        try {
            const cache = await caches.open('asset-chunks');
            await cache.put(chunk.id, new Response(blob));
        } catch {
            // 캐시 실패 무시
        }

        // 메모리 캐시
        this.chunkCache.set(chunk.id, url);
    }

    private chunkCache: Map<string, string> = new Map();

    /** 청크 URL 조회 */
    getChunkUrl(id: string): string | undefined {
        return this.chunkCache.get(id);
    }

    /** 청크 로드 완료 여부 */
    isLoaded(id: string): boolean {
        return this.loadedChunks.has(id);
    }

    /** 진행률 보고 */
    private reportProgress(loaded: number, total: number, currentChunk: string): void {
        if (this.onProgress) {
            this.onProgress({
                loaded,
                total,
                percent: total > 0 ? (loaded / total) * 100 : 0,
                currentChunk,
            });
        }
    }

    /** 모든 캐시 초기화 */
    clearCache(): void {
        this.chunkCache.clear();
        this.loadedChunks.clear();
    }
}
