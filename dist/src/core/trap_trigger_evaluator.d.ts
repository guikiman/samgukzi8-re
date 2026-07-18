/**
 * [B11] 함정 밟음 및 디버프 트리거 — TrapTriggerEvaluator
 *
 * 목적: 적 유닛이 이동 중 함정이 매설된 타일에 진입했을 때의
 *       확률적 기습 발동 연산.
 *
 * 핵심 로직:
 *   1. 적 지력 vs 함정 설치자 지력 판정 → 발동 확률 (기본 70%)
 *   2. 발동 시 이동 즉시 정지 + 화상 상태이상 부여
 */
import type { TrapType } from './stratagem_trap_deployer';
export type TrapStatusEffect = 'NONE' | 'STOPPED' | 'BURNING' | 'STUNNED';
export interface TrapTriggerResult {
    readonly triggered: boolean;
    readonly detectionSuccess: boolean;
    readonly damage: number;
    readonly statusEffect: TrapStatusEffect;
    readonly statusDuration: number;
    readonly description: string;
}
export declare class TrapTriggerEvaluator {
    /**
     * 함정 발동 판정
     *
     * @param trapType    - 함정 유형
     * @param trapDamage  - 함정 기본 데미지
     * @param trapAuthorIntel - 설치 무장 지력
     * @param targetIntel - 적발 무장 지력
     * @returns TrapTriggerResult
     */
    evaluateTrigger(trapType: TrapType, trapDamage: number, trapAuthorIntel: number, targetIntel: number): TrapTriggerResult;
}
//# sourceMappingURL=trap_trigger_evaluator.d.ts.map