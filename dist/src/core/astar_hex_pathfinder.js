/**
 * [Task 48] 이동 경로 탐색용 A* 알고리즘 엔진
 *
 * 헥사곤 맵의 통과 불가능 영역, ZOC 제약 조건을
 * 실시간 반영하여 이동 명령의 실질적 경로 데이터를 연산.
 */
const HEX_DIRECTIONS = [
    [1, 0], [1, -1], [0, -1],
    [-1, 0], [-1, 1], [0, 1],
];
export class AStarHexPathfinder {
    findPath(start, end, isPassable, getMoveCost, maxSteps = 100) {
        const open = new Map();
        const closed = new Set();
        const startNode = {
            q: start.q, r: start.r,
            g: 0, h: this.heuristic(start, end), f: this.heuristic(start, end),
            parent: null,
        };
        open.set(`${start.q},${start.r}`, startNode);
        while (open.size > 0) {
            const current = this.getLowestF(open);
            const key = `${current.q},${current.r}`;
            if (current.q === end.q && current.r === end.r) {
                return this.reconstructPath(current);
            }
            open.delete(key);
            closed.add(key);
            if (current.g >= maxSteps)
                continue;
            for (const [dq, dr] of HEX_DIRECTIONS) {
                const nq = current.q + dq;
                const nr = current.r + dr;
                const nKey = `${nq},${nr}`;
                if (closed.has(nKey))
                    continue;
                const neighbor = { q: nq, r: nr };
                if (!isPassable(neighbor))
                    continue;
                const moveCost = getMoveCost(neighbor);
                const gScore = current.g + moveCost;
                const existing = open.get(nKey);
                if (!existing || gScore < existing.g) {
                    const h = this.heuristic(neighbor, end);
                    open.set(nKey, {
                        q: nq, r: nr,
                        g: gScore, h, f: gScore + h,
                        parent: current,
                    });
                }
            }
        }
        return [];
    }
    heuristic(a, b) {
        return (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.q + a.r - b.q - b.r)) / 2;
    }
    getLowestF(open) {
        let lowest = null;
        for (const node of open.values()) {
            if (!lowest || node.f < lowest.f)
                lowest = node;
        }
        return lowest;
    }
    reconstructPath(node) {
        const path = [];
        let current = node;
        while (current) {
            path.unshift({ q: current.q, r: current.r });
            current = current.parent;
        }
        return path;
    }
}
//# sourceMappingURL=astar_hex_pathfinder.js.map