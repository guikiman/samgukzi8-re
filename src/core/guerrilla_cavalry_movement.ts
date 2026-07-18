/**
 * [15] 경기병 게릴라 기동 — Guerrilla Cavalry Movement
 *
 * 경기병이 공격 완료 후 남은 기동력을 사용해 퇴각하거나,
 * 바람 방향에 맞춰 원거리 사거리가 동적 가변되는 물리 엔진
 */

import type { HexCoord } from './types.js';

export interface HitAndRunResult {
    canExecute: boolean;
    approachPath: HexCoord[];
    attackPosition: HexCoord;
    retreatPath: HexCoord[];
    remainingMP: number;
    distance: number;
}

export interface WindRangeBonus {
    windDirection: number; // 0~360 degrees
    actualRange: number;
    bonus: number;
}

export class GuerrillaCavalryMovement {
    private static readonly BASE_CAVALRY_MP = 6;

    /**
     * 경기병 공격 후 퇴각 (Hit-and-Run)
     *
     * 1. 현재 위치에서 타겟까지 접근 경로 계산
     * 2. 공격 후 남은 MP 계산
     * 3. 남은 MP로 퇴각 경로 탐색
     */
    calculateHitAndRun(
        startPosition: HexCoord,
        targetPosition: HexCoord,
        remainingMP: number,
        enemyPositions: HexCoord[],
    ): HitAndRunResult {
        const approachDistance = this.hexDistance(startPosition, targetPosition);

        if (approachDistance > remainingMP) {
            return {
                canExecute: false,
                approachPath: [],
                attackPosition: targetPosition,
                retreatPath: [],
                remainingMP: 0,
                distance: approachDistance,
            };
        }

        const approachPath = this.linePath(startPosition, targetPosition);
        const mpAfterAttack = remainingMP - approachDistance;

        // 퇴각 경로 (적 위치로부터 가장 먼 방향)
        const retreatPath = this.findRetreatPath(targetPosition, mpAfterAttack, enemyPositions);

        return {
            canExecute: approachDistance <= remainingMP,
            approachPath,
            attackPosition: targetPosition,
            retreatPath,
            remainingMP: mpAfterAttack,
            distance: approachDistance,
        };
    }

    /**
     * 바람 방향 기반 원거리 사거리 계산
     *
     * 순풍: 사거리 +2
     * 역풍: 사거리 -1
     * 무풍: 변화 없음
     */
    calculateWindRangeBonus(
        windDirection: number,     // 0~360
        attackDirection: number,   // 0~360 (공격자가 보는 방향)
        baseRange: number,
    ): WindRangeBonus {
        const angleDiff = Math.abs(windDirection - attackDirection) % 360;
        const normalizedDiff = Math.min(angleDiff, 360 - angleDiff);

        let bonus = 0;
        if (normalizedDiff < 30) {
            bonus = 2; // 순풍
        } else if (normalizedDiff > 150) {
            bonus = -1; // 역풍
        }

        return {
            windDirection,
            actualRange: Math.max(1, baseRange + bonus),
            bonus,
        };
    }

    private hexDistance(a: HexCoord, b: HexCoord): number {
        const dq = Math.abs(a.q - b.q);
        const dr = Math.abs(a.r - b.r);
        const ds = Math.abs((-a.q - a.r) - (-b.q - b.r));
        return Math.max(dq, dr, ds);
    }

    private hexNeighbors(center: HexCoord): HexCoord[] {
        const dirs: [number, number][] = [
            [1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1],
        ];
        return dirs.map(([dq, dr]) => ({ q: center.q + dq, r: center.r + dr }));
    }

    private linePath(from: HexCoord, to: HexCoord): HexCoord[] {
        const path: HexCoord[] = [];
        const steps = this.hexDistance(from, to);
        for (let i = 0; i <= steps; i++) {
            const t = i / Math.max(1, steps);
            path.push({
                q: Math.round(from.q + (to.q - from.q) * t),
                r: Math.round(from.r + (to.r - from.r) * t),
            });
        }
        return path;
    }

    private findRetreatPath(from: HexCoord, maxSteps: number, avoid: HexCoord[]): HexCoord[] {
        const avoidSet = new Set(avoid.map(a => `${a.q},${a.r}`));
        const path: HexCoord[] = [];
        let current = from;

        for (let i = 0; i < maxSteps; i++) {
            const neighbors = this.hexNeighbors(current);
            let best: HexCoord | null = null;
            let bestDist = -1;

            for (const n of neighbors) {
                const nKey = `${n.q},${n.r}`;
                if (avoidSet.has(nKey)) continue;
                const minDistToEnemy = Math.min(...avoid.map(a => this.hexDistance(n, a)));
                if (minDistToEnemy > bestDist) {
                    bestDist = minDistToEnemy;
                    best = n;
                }
            }

            if (!best) break;
            path.push(best);
            current = best;
        }

        return path;
    }
}
