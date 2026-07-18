/**
 * [A3] 동적 세력 밸런서 — Dynamic Faction Balancer
 *
 * DynamicFactionBalancer:
 *   1. 세력별 무장 수, 자원량, 위협 수준 분석
 *   2. 중약소 세력 동적 보너스 (징병 속도, 내정 효율)
 *   3. 1위 세력 디버프 (연합/반감)
 *   4. 실시간 밸런스 조정
 */
export interface FactionMetrics {
    readonly factionId: string;
    readonly officerCount: number;
    readonly cityCount: number;
    readonly totalDevelopment: number;
    readonly totalSoldiers: number;
    readonly totalGold: number;
    readonly totalFood: number;
    readonly powerRank: number;
}
export interface BalanceBonus {
    readonly factionId: string;
    readonly recruitmentBonus: number;
    readonly domesticBonus: number;
    readonly moraleBonus: number;
    readonly diplomacyBonus: number;
}
export declare class DynamicFactionBalancer {
    private metrics;
    private bonuses;
    private readonly BONUS_POWER_THRESHOLD;
    private readonly PENALTY_POWER_THRESHOLD;
    updateMetrics(allFactions: FactionMetrics[]): void;
    private calculateBonuses;
    getBonus(factionId: string): BalanceBonus | null;
    getMetric(factionId: string): FactionMetrics | null;
    getAllBonuses(): BalanceBonus[];
    getAllMetrics(): FactionMetrics[];
    clear(): void;
}
//# sourceMappingURL=dynamic_faction_balancer.d.ts.map