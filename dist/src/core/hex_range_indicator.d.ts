/**
 * [Task 99] 헥스 범위 인디케이터 — HexRangeIndicator
 *
 * 목적: 이동 가능 범위, 공격 범위, 스킬 범위 등
 *       헥스 맵 위의 다양한 범위를 시각적 표시.
 *
 * 핵심 로직:
 *   1. BFS 기반 이동 가능 타일 계산
 *   2. 범위 타입별 색상/패턴
 */
export type RangeType = "move" | "attack" | "skill" | "sight" | "influence";
export interface RangeTile {
    readonly q: number;
    readonly r: number;
    readonly cost: number;
}
export declare class HexRangeIndicator {
    private tiles;
    /**
     * BFS로 이동 가능 범위 계산
     */
    computeMoveRange(originQ: number, originR: number, maxMove: number, getCost: (q: number, r: number) => number): RangeTile[];
    /**
     * 범위 타일 설정
     */
    setRange(tiles: RangeTile[]): void;
    /**
     * 범위 초기화
     */
    clearRange(): void;
    /**
     * 타일의 범위 색상 조회
     */
    getColor(q: number, r: number, type: RangeType): [number, number, number, number] | null;
}
//# sourceMappingURL=hex_range_indicator.d.ts.map