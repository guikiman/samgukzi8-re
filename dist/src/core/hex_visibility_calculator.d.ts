/**
 * [Task 84] 헥스 가시성 계산기 — HexVisibilityCalculator
 *
 * 목적: 유닛의 시야 범위를 기반으로 헥스 타일의
 *       가시 여부를 계산.
 *
 * 핵심 로직:
 *   1. 유닛 위치에서 반경 내 타일 가시 판정
 *   2. 장애물(산, 숲)에 의한 시야 차단
 */
export interface VisibilityResult {
    readonly q: number;
    readonly r: number;
    readonly visible: boolean;
}
export declare class HexVisibilityCalculator {
    /**
     * 시야 반경 내 타일 목록 계산 (Bresenham 기반)
     */
    computeVisibleTiles(originQ: number, originR: number, sightRange: number, isBlocked: (q: number, r: number) => boolean): VisibilityResult[];
    /**
     * 두 헥스 좌표 사이의 시야 차단 검사
     */
    private isLineBlocked;
}
//# sourceMappingURL=hex_visibility_calculator.d.ts.map