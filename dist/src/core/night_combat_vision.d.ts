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
export declare class NightCombatVisionDiminisher {
    private readonly VISION_REDUCTION;
    private readonly AMBUSH_BONUS;
    private readonly CRITICAL_BONUS;
    getNightModifiers(turn: number): NightCombatModifiers;
    calculateVisibleRange(baseRange: number, turn: number): number;
    calculateAmbushSuccess(baseChance: number, turn: number): number;
    calculateCriticalMultiplier(baseMultiplier: number, turn: number): number;
}
//# sourceMappingURL=night_combat_vision.d.ts.map