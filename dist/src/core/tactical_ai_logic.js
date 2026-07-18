/**
 * [10] 전술 AI 로직 — Tactical AI Logic
 *
 * 헥사 타일 전투에서 AI 군대 부대들이 ZOC 물리 제약을 우회하거나
 * 협동 연격을 유도하는 전술 행동 결정 트리(Behavior Tree)
 */
export class TacticalAILogic {
    /**
     * 전술 위치 평가
     *
     * 주변 적 유닛 수, 아군 지원 거리, 지형 이점을 종합 평가
     */
    evaluatePosition(unit, allyPositions, enemyPositions, terrainTypes) {
        const nearbyEnemies = this.countNearby(unit.position, enemyPositions, 3);
        const nearbyAllies = this.countNearby(unit.position, allyPositions, 3);
        const terrainKey = `${unit.position.q},${unit.position.r}`;
        const terrain = terrainTypes.get(terrainKey) ?? 'plain';
        let threatLevel = nearbyEnemies * 0.3;
        if (terrain === 'mountain')
            threatLevel -= 0.1;
        if (terrain === 'river')
            threatLevel += 0.2;
        const flankPossible = nearbyAllies >= 2 && nearbyEnemies >= 1;
        const retreatRecommended = threatLevel > 0.7 || unit.morale < 30;
        // 가장 위협적인 적 위치를 bestTarget으로
        const bestTarget = enemyPositions.length > 0 ? enemyPositions[0] : null;
        return { threatLevel, flankPossible, retreatRecommended, bestTarget };
    }
    /**
     * ZOC (Zone of Control) 우회 경로 계산
     *
     * 적 ZOC 범위(1헥사) 내에 있는 타일을 회피하는 경로 탐색
     */
    calculateZOCBypass(start, goal, zocUnits) {
        const zocSet = new Set();
        for (const zu of zocUnits) {
            for (const neighbor of this.hexNeighbors(zu)) {
                zocSet.add(`${neighbor.q},${neighbor.r}`);
            }
        }
        // 목표가 ZOC 범위 내에 있으면 직선 경로 반환
        if (zocSet.has(`${goal.q},${goal.r}`)) {
            return this.straightLinePath(start, goal);
        }
        // 단순 BFS로 ZOC 회피 경로 탐색 (최대 1000 노드 제한)
        const queue = [start];
        const visited = new Set([`${start.q},${start.r}`]);
        const parent = new Map();
        let nodeCount = 0;
        while (queue.length > 0 && nodeCount < 1000) {
            const current = queue.shift();
            nodeCount++;
            if (current.q === goal.q && current.r === goal.r) {
                return this.reconstructPath(parent, start, current);
            }
            for (const neighbor of this.hexNeighbors(current)) {
                const nKey = `${neighbor.q},${neighbor.r}`;
                if (visited.has(nKey) || zocSet.has(nKey))
                    continue;
                visited.add(nKey);
                parent.set(nKey, current);
                queue.push(neighbor);
            }
        }
        // ZOC 회피 불가 → 직선 경로 반환
        return this.straightLinePath(start, goal);
    }
    /**
     * 협동 공격 평가
     *
     * 아군 유닛들이 특정 타겟을 협공할 수 있는지 판단
     */
    coordinateJointAttack(primaryUnit, allyUnits, targetPosition) {
        const participants = [primaryUnit.id];
        const targetNeighbors = this.hexNeighborsCoord(targetPosition);
        for (const ally of allyUnits) {
            if (ally.id === primaryUnit.id)
                continue;
            const allyKey = `${ally.position.q},${ally.position.r}`;
            for (const tn of targetNeighbors) {
                if (`${tn.q},${tn.r}` === allyKey) {
                    participants.push(ally.id);
                    break;
                }
            }
        }
        if (participants.length >= 2) {
            const baseDamage = primaryUnit.soldiers * 0.1;
            const synergyBonus = 1 + (participants.length - 1) * 0.15;
            return {
                canExecute: true,
                participants,
                expectedDamage: Math.floor(baseDamage * synergyBonus),
            };
        }
        return { canExecute: false, participants: [primaryUnit.id], expectedDamage: 0 };
    }
    /**
     * 기병 돌격 거리 평가
     *
     * 경기병 공격 후 남은 기동력으로 퇴각 가능한 거리 계산
     */
    evaluateCavalryCharge(cavalry, target, enemyPositions) {
        const chargeDistance = this.hexDistance(cavalry.position, target);
        if (chargeDistance > cavalry.remainingMP) {
            return { canCharge: false, retreatPath: [], remainingMP: cavalry.remainingMP };
        }
        const mpAfterAttack = cavalry.remainingMP - chargeDistance;
        if (mpAfterAttack <= 0) {
            return { canCharge: true, retreatPath: [], remainingMP: 0 };
        }
        // 퇴각 경로 탐색 (적으로부터 멀어지는 방향)
        const retreatPath = this.findRetreatPath(target, mpAfterAttack, enemyPositions);
        return { canCharge: true, retreatPath, remainingMP: mpAfterAttack };
    }
    hexDistance(a, b) {
        const dq = Math.abs(a.q - b.q);
        const dr = Math.abs(a.r - b.r);
        const ds = Math.abs((-a.q - a.r) - (-b.q - b.r));
        return Math.max(dq, dr, ds);
    }
    hexNeighborsCoord(center) {
        const dirs = [
            [1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1],
        ];
        return dirs.map(([dq, dr]) => ({ q: center.q + dq, r: center.r + dr }));
    }
    hexNeighbors(center) {
        return this.hexNeighborsCoord(center);
    }
    countNearby(pos, targets, range) {
        return targets.filter(t => this.hexDistance(pos, t) <= range).length;
    }
    reconstructPath(parent, start, end) {
        const path = [end];
        let current = `${end.q},${end.r}`;
        while (current !== `${start.q},${start.r}`) {
            const p = parent.get(current);
            path.unshift(p);
            current = `${p.q},${p.r}`;
        }
        return path;
    }
    straightLinePath(start, goal) {
        return [start, goal];
    }
    findRetreatPath(from, maxSteps, avoid) {
        const avoidSet = new Set(avoid.map(a => `${a.q},${a.r}`));
        const path = [];
        let current = from;
        for (let i = 0; i < maxSteps; i++) {
            const neighbors = this.hexNeighbors(current);
            let best = null;
            let bestDist = -1;
            for (const n of neighbors) {
                const nKey = `${n.q},${n.r}`;
                if (avoidSet.has(nKey))
                    continue;
                const minDistToEnemy = Math.min(...avoid.map(a => this.hexDistance(n, a)));
                if (minDistToEnemy > bestDist) {
                    bestDist = minDistToEnemy;
                    best = n;
                }
            }
            if (!best)
                break;
            path.push(best);
            current = best;
        }
        return path;
    }
}
TacticalAILogic.ZOC_RANGE = 1; // ZOC 적용 헥사 거리
//# sourceMappingURL=tactical_ai_logic.js.map