/**
 * [B13] 보급로 경로 차단 판정기 — SupplyLineCutter
 *
 * 목적: 보급 도시(거점 본진)와 부대 간의 연결선이 적 타일에 의해
 *       단절되었는지 매 턴 검사.
 *
 * 핵심 로직:
 *   1. BFS(너비 우선 탐색)로 본진→부대 경로 상 적 유닛/통제 타일 검사
 *   2. 단절 시 사기 매 턴 20 하락
 */
export interface HexCoord {
    readonly q: number;
    readonly r: number;
}
export interface SupplyLineState {
    readonly unitId: string;
    readonly connected: boolean;
    readonly blockedByPosition: HexCoord | null;
    readonly pathLength: number;
    readonly moralePenalty: number;
}
export declare class SupplyLineCutter {
    /**
     * BFS로 보급 경로 탐색
     *
     * @param unitQ        - 부대 q 좌표
     * @param unitR        - 부대 r 좌표
     * @param baseQ        - 본진 q 좌표
     * @param baseR        - 본진 r 좌표
     * @param enemyPositions - 적 유닛 위치 목록
     * @param enemyControlTiles - 적 통제 타일 목록 ("q,r" 키)
     * @param maxRange     - 최대 보급 범위 (기본 20)
     */
    checkSupplyLine(unitQ: number, unitR: number, baseQ: number, baseR: number, enemyPositions: HexCoord[], enemyControlTiles: Set<string>, maxRange?: number): SupplyLineState;
}
//# sourceMappingURL=supply_line_cutter.d.ts.map