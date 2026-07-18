/**
 * [Task 48] 이동 경로 탐색용 A* 알고리즘 엔진
 *
 * 헥사곤 맵의 통과 불가능 영역, ZOC 제약 조건을
 * 실시간 반영하여 이동 명령의 실질적 경로 데이터를 연산.
 */
import { HexCoord } from "./render_queue_types";
export interface AStarNode {
    readonly q: number;
    readonly r: number;
    readonly g: number;
    readonly h: number;
    readonly f: number;
    readonly parent: AStarNode | null;
}
export declare class AStarHexPathfinder {
    findPath(start: HexCoord, end: HexCoord, isPassable: (coord: HexCoord) => boolean, getMoveCost: (coord: HexCoord) => number, maxSteps?: number): HexCoord[];
    private heuristic;
    private getLowestF;
    private reconstructPath;
}
//# sourceMappingURL=astar_hex_pathfinder.d.ts.map