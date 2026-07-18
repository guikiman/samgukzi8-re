/**
 * [Task 59] LZ-string 압축 엔진 연동 — SaveCompressor
 *
 * 세이브 데이터를 압축/해제하여 로컬스토리지 한계 극복.
 */
export declare class SaveCompressor {
    compress(data: string): string;
    decompress(data: string): string;
    getCompressionRatio(original: string, compressed: string): number;
    isCompressed(data: string): boolean;
    private lzCompress;
    private lzDecompress;
}
//# sourceMappingURL=save_compressor.d.ts.map