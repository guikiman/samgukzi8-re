/**
 * [B25] 혼란/도발 상태이상 FSM 핸들러 — ChaosDisruptState
 *
 * 목적: 계략으로 인해 상태이상에 걸린 유닛의 AI 통제권을 뺏고
 *       스스로를 자해하거나 도발 무장을 강제 추적하게 제어.
 *
 * 핵심 로직:
 *   1. CONFUSED: 50% 아무 행동 불가, 30% 아군 무차별 타격
 *   2. TAUNTED: 도발 타겟 좌표로 최단 경로 맹목 이동
 */
export type UnitCondition = 'NORMAL' | 'CONFUSED' | 'TAUNTED' | 'STUNNED';
export type ChaosAction = 'NO_ACTION' | 'ATTACK_ALLY' | 'ATTACK_SELF' | 'MOVE_TOWARD_TAUNTER' | 'NORMAL_ACTION';
export interface ConditionState {
    readonly unitId: string;
    readonly condition: UnitCondition;
    readonly remainingTurns: number;
    readonly tauntTargetCoord?: {
        q: number;
        r: number;
    };
    readonly tauntTargetId?: string;
}
export interface ChaosActionResult {
    readonly action: ChaosAction;
    readonly targetUnitId?: string;
    readonly damageToSelf?: number;
    readonly forcedMovement?: {
        q: number;
        r: number;
    };
    readonly description: string;
}
export declare class ChaosDisruptState {
    private conditions;
    /** 상태이상 부여 */
    applyCondition(unitId: string, condition: UnitCondition, duration: number, tauntTarget?: {
        q: number;
        r: number;
        targetId: string;
    }): ConditionState;
    /** 턴 처리: 상태이상 효과 적용 */
    processTurn(unitId: string, adjacentAllyIds: string[]): ChaosActionResult;
    /** 턴 종료 시 지속시간 감소 및 해제 */
    tickDuration(unitId: string): ConditionState | null;
    /** 현재 상태 조회 */
    getCondition(unitId: string): ConditionState | undefined;
    /** 상태 해제 */
    clearCondition(unitId: string): boolean;
    /** 모든 조건 정보 반환 */
    getAllConditions(): ConditionState[];
}
//# sourceMappingURL=chaos_disrupt_state.d.ts.map