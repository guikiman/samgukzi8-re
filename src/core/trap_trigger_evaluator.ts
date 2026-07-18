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
    readonly detectionSuccess: boolean;   // 적이 함정을 탐지했는지
    readonly damage: number;
    readonly statusEffect: TrapStatusEffect;
    readonly statusDuration: number;      // 지속 턴 수
    readonly description: string;
}

export class TrapTriggerEvaluator {
    /**
     * 함정 발동 판정
     *
     * @param trapType    - 함정 유형
     * @param trapDamage  - 함정 기본 데미지
     * @param trapAuthorIntel - 설치 무장 지력
     * @param targetIntel - 적발 무장 지력
     * @returns TrapTriggerResult
     */
    evaluateTrigger(
        trapType: TrapType,
        trapDamage: number,
        trapAuthorIntel: number,
        targetIntel: number,
    ): TrapTriggerResult {
        // 1. 적 탐지 판정: 적 지력 > 설치자 지력 * 1.2 면 탐지 성공
        const detectionThreshold = trapAuthorIntel * 1.2;
        const detectionSuccess = targetIntel >= detectionThreshold;

        if (detectionSuccess) {
            return {
                triggered: false,
                detectionSuccess: true,
                damage: 0,
                statusEffect: 'NONE',
                statusDuration: 0,
                description: '적이 함정을 탐지하여 회피했습니다!',
            };
        }

        // 2. 발동 확률: 기본 70%
        const baseTriggerRate = 0.7;
        const intelRatio = trapAuthorIntel / Math.max(1, targetIntel);
        const finalTriggerRate = Math.min(0.95, baseTriggerRate * intelRatio);

        const triggered = Math.random() < finalTriggerRate;

        if (!triggered) {
            return {
                triggered: false,
                detectionSuccess: false,
                damage: Math.floor(trapDamage * 0.3),
                statusEffect: 'NONE',
                statusDuration: 0,
                description: '함정이 발동했으나 빗나갔습니다! (일부 데미지)',
            };
        }

        // 3. 발동 성공: 상태이상 부여
        const statusEffect: TrapStatusEffect = trapType === 'FIRE' ? 'BURNING' : 'STOPPED';
        const statusDuration = trapType === 'FIRE' ? 3 : 1;
        const finalDamage = trapType === 'ROCK'
            ? trapDamage
            : Math.floor(trapDamage * 0.6); // FIRE: 즉시 데미지 적음 (지속 데미지)

        return {
            triggered: true,
            detectionSuccess: false,
            damage: finalDamage,
            statusEffect,
            statusDuration,
            description: `함정 발동! ${statusEffect === 'BURNING' ? '화상' : '이동 정지'} ${statusDuration}턴`,
        };
    }
}
