/**
 * [Task 59] LZ-string 압축 엔진 연동 — SaveCompressor
 *
 * 세이브 데이터를 압축/해제하여 로컬스토리지 한계 극복.
 * LZW 기반이며 UTF-16 코드 단위 전체(0~65535)를 단일 문자 코드로 사용하고
 * 사전 코드는 65536부터 시작해 코드 공간 충돌이 없음 (유니코드 안전, 무손실).
 */
export declare class SaveCompressor {
    compress(data: string): string;
    decompress(data: string): string;
    getCompressionRatio(original: string, compressed: string): number;
    isCompressed(data: string): boolean;
    /**
     * UTF-16 코드 단위 단위 LZW 압축.
     * 출력 코드 n을 2개의 코드 단위(하위 16bit / 상위 16bit)로 인코딩해
     * 사전 코드가 65535를 넘어도 안전하다.
     */
    private lzCompress;
    private lzDecompress;
}
//# sourceMappingURL=save_compressor.d.ts.map