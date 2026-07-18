/**
 * [E4] 치안(민심) 안정 기믹 — Public Order System
 *
 * PublicOrderSystem:
 *   1. 치안 수치 0~100, 하락 시 도적·반란군 발생 확률 증가
 *   2. 치안 = 기본치안 - 점령후감소 + 치안유지활동
 *   3. 반란 확률 = (100 - 치안) / 200
 *   4. 무장 순찰 시 치안 회복
 */
export interface CityPublicOrder {
    readonly cityId: string;
    orderLevel: number;
    occupationPenalty: number;
    recentPatrolBonus: number;
}
export interface PatrolResult {
    readonly orderGain: number;
    readonly newOrderLevel: number;
    readonly revoltRiskBefore: number;
    readonly revoltRiskAfter: number;
}
export interface RevoltCheckResult {
    readonly revoltOccurred: boolean;
    readonly rebelPower: number;
    readonly reason: string;
}
export declare class PublicOrderSystem {
    private readonly MAX_ORDER;
    getRevoltRisk(city: CityPublicOrder): number;
    patrol(city: CityPublicOrder, officerPolitics: number, hasPoliceSkill: boolean): PatrolResult;
    checkRevolt(city: CityPublicOrder): RevoltCheckResult;
    applyOccupationPenalty(city: CityPublicOrder): void;
    processMonthlyDecay(city: CityPublicOrder): void;
}
//# sourceMappingURL=public_order_system.d.ts.map