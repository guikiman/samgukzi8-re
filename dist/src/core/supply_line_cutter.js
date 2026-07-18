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
const HEX_DIRECTIONS = [
    [1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1],
];
const MORALE_PENALTY_PER_TURN = 20;
export class SupplyLineCutter {
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
    checkSupplyLine(unitQ, unitR, baseQ, baseR, enemyPositions, enemyControlTiles, maxRange = 20) {
        // 적 위치 Set
        const enemySet = new Set(enemyPositions.map(e => `${e.q},${e.r}`));
        // BFS: 본진 → 부대 경로 탐색
        const visited = new Set();
        const queue = [{ q: baseQ, r: baseR, dist: 0 }];
        const unitKey = `${unitQ},${unitR}`;
        let found = false;
        let blockedPosition = null;
        while (queue.length > 0) {
            const curr = queue.shift();
            const currKey = `${curr.q},${curr.r}`;
            if (currKey === unitKey) {
                found = true;
                break;
            }
            if (visited.has(currKey))
                continue;
            visited.add(currKey);
            if (curr.dist >= maxRange)
                continue;
            // 인접 6방향 탐색
            for (const [dq, dr] of HEX_DIRECTIONS) {
                const nq = curr.q + dq;
                const nr = curr.r + dr;
                const nKey = `${nq},${nr}`;
                if (visited.has(nKey))
                    continue;
                // 적 유닛 or 적 통제 타일 = 경로 차단
                if (enemySet.has(nKey) || enemyControlTiles.has(nKey)) {
                    if (!blockedPosition)
                        blockedPosition = { q: nq, r: nr };
                    continue;
                }
                queue.push({ q: nq, r: nr, dist: curr.dist + 1 });
            }
        }
        const connected = found;
        return {
            unitId: `${unitQ},${unitR}`,
            connected,
            blockedByPosition: blockedPosition,
            pathLength: found ? visited.size : -1,
            moralePenalty: connected ? 0 : MORALE_PENALTY_PER_TURN,
        };
    }
}
//# sourceMappingURL=supply_line_cutter.js.map