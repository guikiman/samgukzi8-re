/**
 * [Task 73] 아틀라스 디프래그멘터 — AtlasDefragmenter
 *
 * 목적: 아틀라스 내 제거된 리전으로 인한 단편화를
 *       최적화하여 공간 효율 복원.
 *
 * 핵심 로직:
 *   1. 사용 중인 리전 목록 스캔
 *   2. 단편화율 계산 (사용 가능 공간 / 전체 공간)
 *   3. 단편화 심각 시 리패킹 제안
 */
export interface Rect {
    readonly x: number;
    readonly y: number;
    readonly w: number;
    readonly h: number;
}
export declare class AtlasDefragmenter {
    private readonly atlasWidth;
    private readonly atlasHeight;
    private usedRegions;
    private freeRegions;
    constructor(width: number, height: number);
    /**
     * 리전 할당
     */
    alloc(w: number, h: number): Rect | null;
    /**
     * 리전 제거
     */
    free(rect: Rect): void;
    /**
     * 단편화율 계산 (0 ~ 1)
     */
    getFragmentationRatio(): number;
    /**
     * 단편화가 심각한가?
     */
    isFragmented(threshold?: number): boolean;
    /**
     * 인접 자유 영역 병합
     */
    private coalesce;
}
//# sourceMappingURL=atlas_defragmenter.d.ts.map