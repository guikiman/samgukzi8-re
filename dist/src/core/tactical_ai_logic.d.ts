/**
 * [10] 전술 AI 로직 — Tactical AI Logic
 *
 * 헥사 타일 전투에서 AI 군대 부대들이 ZOC 물리 제약을 우회하거나
 * 협동 연격을 유도하는 전술 행동 결정 트리(Behavior Tree)
 */
import type { HexCoord } from './types.js';
export interface TacticalUnit {
    id: string;
    position: HexCoord;
    unitType: 'infantry' | 'cavalry' | 'archer' | 'siege';
    soldiers: number;
    morale: number;
    remainingMP: number;
}
export interface TacticalEvaluation {
    threatLevel: number;
    flankPossible: boolean;
    retreatRecommended: boolean;
    bestTarget: HexCoord | null;
}
export declare class TacticalAILogic {
    private static readonly ZOC_RANGE;
    /**
     * 전술 위치 평가
     *
     * 주변 적 유닛 수, 아군 지원 거리, 지형 이점을 종합 평가
     */
    evaluatePosition(unit: TacticalUnit, allyPositions: HexCoord[], enemyPositions: HexCoord[], terrainTypes: Map<string, string>): TacticalEvaluation;
    /**
     * ZOC (Zone of Control) 우회 경로 계산
     *
     * 적 ZOC 범위(1헥사) 내에 있는 타일을 회피하는 경로 탐색
     */
    calculateZOCBypass(start: HexCoord, goal: HexCoord, zocUnits: HexCoord[]): HexCoord[];
    /**
     * 협동 공격 평가
     *
     * 아군 유닛들이 특정 타겟을 협공할 수 있는지 판단
     */
    coordinateJointAttack(primaryUnit: TacticalUnit, allyUnits: TacticalUnit[], targetPosition: HexCoord): {
        canExecute: boolean;
        participants: string[];
        expectedDamage: number;
    };
    /**
     * 기병 돌격 거리 평가
     *
     * 경기병 공격 후 남은 기동력으로 퇴각 가능한 거리 계산
     */
    evaluateCavalryCharge(cavalry: TacticalUnit, target: HexCoord, enemyPositions: HexCoord[]): {
        canCharge: boolean;
        retreatPath: HexCoord[];
        remainingMP: number;
    };
    private hexDistance;
    private hexNeighborsCoord;
    private hexNeighbors;
    private countNearby;
    private reconstructPath;
    private straightLinePath;
    private findRetreatPath;
}
//# sourceMappingURL=tactical_ai_logic.d.ts.map