/**
 * [B29] 야간 전투 시야 제한 — Night Combat Vision Diminisher
 *
 * NightCombatVisionDiminisher:
 *   1. 주야간 페이즈가 밤(Night) 진입 시 처리
 *   2. 아군 전체 기본 가시 타일 거리 -2
 *   3. 적의 기습(매복) 성공률 상향
 *   4. 적 치명타 보정값 상향
 */

export interface NightCombatModifiers {
    readonly isNight: boolean;
    readonly visionRangeReduction: number;
    readonly ambushSuccessBonus: number;
    readonly criticalDamageBonus: number;
}

export class NightCombatVisionDiminisher {
    private readonly VISION_REDUCTION = 2;
    private readonly AMBUSH_BONUS = 0.2;
    private readonly CRITICAL_BONUS = 0.15;

    getNightModifiers(turn: number): NightCombatModifiers {
        const isNight = turn % 2 === 0;
        if (!isNight) {
            return { isNight: false, visionRangeReduction: 0, ambushSuccessBonus: 0, criticalDamageBonus: 0 };
        }
        return {
            isNight: true,
            visionRangeReduction: this.VISION_REDUCTION,
            ambushSuccessBonus: this.AMBUSH_BONUS,
            criticalDamageBonus: this.CRITICAL_BONUS,
        };
    }

    calculateVisibleRange(baseRange: number, turn: number): number {
        const mods = this.getNightModifiers(turn);
        return Math.max(1, baseRange - mods.visionRangeReduction);
    }

    calculateAmbushSuccess(baseChance: number, turn: number): number {
        const mods = this.getNightModifiers(turn);
        return mods.isNight ? Math.min(1.0, baseChance + mods.ambushSuccessBonus) : baseChance;
    }

    calculateCriticalMultiplier(baseMultiplier: number, turn: number): number {
        const mods = this.getNightModifiers(turn);
        return mods.isNight ? baseMultiplier + mods.criticalDamageBonus : baseMultiplier;
    }
}
