/**
 * [Task 82] 헥스 경로 미리보기 — HexPathPreview
 *
 * 목적: 유닛 이동 경로를 시각적으로 미리보기하여
 *       각 타일의 이동 비용과 최종 경로 표시.
 *
 * 핵심 로직:
 *   1. 경로 좌표 리스트 → 타일 하이라이트
 *   2. 이동 비용별 색상 그라데이션
 */
export interface PathStep {
    readonly q: number;
    readonly r: number;
    readonly cost: number;
    readonly cumulativeCost: number;
}
export declare class HexPathPreview {
    private steps;
    private readonly maxCost;
    constructor(maxCost?: number);
    /**
     * 경로 설정
     */
    setPath(path: PathStep[]): void;
    /**
     * 경로 초기화
     */
    clearPath(): void;
    /**
     * 특정 좌표의 경로 비용 조회
     */
    getCostAt(q: number, r: number): number | null;
    /**
     * 경로의 총 비용
     */
    get totalCost(): number;
    /**
     * 경로 길이
     */
    get length(): number;
    /**
     * 경로의 각 단계별 색상 (비용 기반 그라데이션)
     */
    getPathColors(maxVisibleCost: number): Map<string, [number, number, number, number]>;
}
//# sourceMappingURL=hex_path_preview.d.ts.map