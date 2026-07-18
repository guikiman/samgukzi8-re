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
    windDirection: number;
    actualRange: number;
    bonus: number;
}
export declare class GuerrillaCavalryMovement {
    private static readonly BASE_CAVALRY_MP;
    /**
     * 경기병 공격 후 퇴각 (Hit-and-Run)
     *
     * 1. 현재 위치에서 타겟까지 접근 경로 계산
     * 2. 공격 후 남은 MP 계산
     * 3. 남은 MP로 퇴각 경로 탐색
     */
    calculateHitAndRun(startPosition: HexCoord, targetPosition: HexCoord, remainingMP: number, enemyPositions: HexCoord[]): HitAndRunResult;
    /**
     * 바람 방향 기반 원거리 사거리 계산
     *
     * 순풍: 사거리 +2
     * 역풍: 사거리 -1
     * 무풍: 변화 없음
     */
    calculateWindRangeBonus(windDirection: number, // 0~360
    attackDirection: number, // 0~360 (공격자가 보는 방향)
    baseRange: number): WindRangeBonus;
    private hexDistance;
    private hexNeighbors;
    private linePath;
    private findRetreatPath;
}
//# sourceMappingURL=guerrilla_cavalry_movement.d.ts.map