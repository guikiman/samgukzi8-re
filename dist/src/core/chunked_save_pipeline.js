/**
 * [Task 53] 청크 단위 분할 저장 — ChunkedSavePipeline
 *
 * 큰 세이브 데이터를 청크로 분할하여 저장/로드.
 */
export class ChunkedSavePipeline {
    constructor(maxChunkSize = 1024 * 1024) {
        this.maxChunkSize = maxChunkSize;
    }
    split(data) {
        const totalSize = new TextEncoder().encode(data).length;
        const totalChunks = Math.ceil(totalSize / this.maxChunkSize);
        const chunks = [];
        for (let i = 0; i < totalChunks; i++) {
            const start = i * this.maxChunkSize;
            const end = Math.min(start + this.maxChunkSize, data.length);
            const chunkData = data.slice(start, end);
            chunks.push({
                metadata: {
                    chunkIndex: i,
                    totalChunks,
                    chunkSize: new TextEncoder().encode(chunkData).length,
                    totalSize,
                    checksum: this.simpleHash(chunkData),
                },
                data: chunkData,
            });
        }
        return chunks;
    }
    merge(chunks) {
        const sorted = [...chunks].sort((a, b) => a.metadata.chunkIndex - b.metadata.chunkIndex);
        return sorted.map((c) => c.data).join("");
    }
    validate(chunks) {
        const errors = [];
        if (chunks.length === 0) {
            errors.push("No chunks provided");
            return { valid: false, errors };
        }
        const first = chunks[0].metadata;
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            if (chunk.metadata.totalChunks !== first.totalChunks) {
                errors.push(`Chunk ${i}: totalChunks mismatch (${chunk.metadata.totalChunks} vs ${first.totalChunks})`);
            }
            const computedHash = this.simpleHash(chunk.data);
            if (computedHash !== chunk.metadata.checksum) {
                errors.push(`Chunk ${i}: checksum mismatch`);
            }
        }
        const indices = chunks.map((c) => c.metadata.chunkIndex).sort((a, b) => a - b);
        for (let i = 0; i < indices.length; i++) {
            if (indices[i] !== i) {
                errors.push(`Missing chunk index ${i}`);
            }
        }
        return { valid: errors.length === 0, errors };
    }
    getChunkCount(data) {
        const totalSize = new TextEncoder().encode(data).length;
        return Math.ceil(totalSize / this.maxChunkSize);
    }
    simpleHash(str) {
        let hash = 0x811C9DC5;
        const bytes = new TextEncoder().encode(str);
        for (let i = 0; i < bytes.length; i++) {
            hash ^= bytes[i];
            hash = Math.imul(hash, 0x01000193);
        }
        return hash >>> 0;
    }
}
//# sourceMappingURL=chunked_save_pipeline.js.map