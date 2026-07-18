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
    readonly tauntTargetCoord?: { q: number; r: number };
    readonly tauntTargetId?: string;
}

export interface ChaosActionResult {
    readonly action: ChaosAction;
    readonly targetUnitId?: string;
    readonly damageToSelf?: number;
    readonly forcedMovement?: { q: number; r: number };
    readonly description: string;
}

export class ChaosDisruptState {
    private conditions: Map<string, ConditionState> = new Map();

    /** 상태이상 부여 */
    applyCondition(
        unitId: string,
        condition: UnitCondition,
        duration: number,
        tauntTarget?: { q: number; r: number; targetId: string },
    ): ConditionState {
        const state: ConditionState = {
            unitId,
            condition,
            remainingTurns: duration,
            ...(tauntTarget ? {
                tauntTargetCoord: { q: tauntTarget.q, r: tauntTarget.r },
                tauntTargetId: tauntTarget.targetId,
            } : {}),
        };
        this.conditions.set(unitId, state);
        return state;
    }

    /** 턴 처리: 상태이상 효과 적용 */
    processTurn(unitId: string, adjacentAllyIds: string[]): ChaosActionResult {
        const cond = this.conditions.get(unitId);
        if (!cond) {
            return { action: 'NORMAL_ACTION', description: '정상 상태' };
        }

        switch (cond.condition) {
            case 'CONFUSED': {
                const roll = Math.random();
                if (roll < 0.5) {
                    // 50%: 아무 행동 불가
                    return { action: 'NO_ACTION', description: '혼란에 빠져 아무 행동도 하지 못함!' };
                } else if (roll < 0.8 && adjacentAllyIds.length > 0) {
                    // 30%: 아군 무차별 타격
                    const targetIdx = Math.floor(Math.random() * adjacentAllyIds.length);
                    return {
                        action: 'ATTACK_ALLY',
                        targetUnitId: adjacentAllyIds[targetIdx],
                        description: '혼란! 아군을 무차별 공격!',
                    };
                }
                return { action: 'NORMAL_ACTION', description: '간신히 정신을 차렸다' };
            }

            case 'TAUNTED': {
                if (cond.tauntTargetCoord) {
                    return {
                        action: 'MOVE_TOWARD_TAUNTER',
                        forcedMovement: cond.tauntTargetCoord,
                        description: '도발에 넘어가 무작정 추적!',
                    };
                }
                return { action: 'NORMAL_ACTION', description: '도발이 풀렸다' };
            }

            case 'STUNNED': {
                return { action: 'NO_ACTION', description: '기절! 아무 행동 불가' };
            }

            default:
                return { action: 'NORMAL_ACTION', description: '정상 상태' };
        }
    }

    /** 턴 종료 시 지속시간 감소 및 해제 */
    tickDuration(unitId: string): ConditionState | null {
        const cond = this.conditions.get(unitId);
        if (!cond) return null;

        const newRemaining = cond.remainingTurns - 1;
        if (newRemaining <= 0) {
            this.conditions.delete(unitId);
            return null; // 해제됨
        }

        const updated: ConditionState = { ...cond, remainingTurns: newRemaining };
        this.conditions.set(unitId, updated);
        return updated;
    }

    /** 현재 상태 조회 */
    getCondition(unitId: string): ConditionState | undefined {
        return this.conditions.get(unitId);
    }

    /** 상태 해제 */
    clearCondition(unitId: string): boolean {
        return this.conditions.delete(unitId);
    }

    /** 모든 조건 정보 반환 */
    getAllConditions(): ConditionState[] {
        return Array.from(this.conditions.values());
    }
}
