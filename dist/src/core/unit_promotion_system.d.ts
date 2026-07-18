/**
 * [B20] 병과 승급 시스템 — Unit Promotion System
 *
 * 승급 트리:
 *   INFANTRY → HEAVY_INFANTRY → ELITE_INFANTRY  (100/300/600 exp)
 *   CAVALRY → HEAVY_CAVALRY → ELITE_CAVALRY      (100/300/600 exp)
 *   ARCHER → CROSSBOW → ELITE_ARCHER               (100/300/600 exp)
 * 각 승급: 금 200→500→1000
 */
import type { OfficerID, OfficerStats } from './types';
export type UnitClass = 'INFANTRY' | 'HEAVY_INFANTRY' | 'ELITE_INFANTRY' | 'CAVALRY' | 'HEAVY_CAVALRY' | 'ELITE_CAVALRY' | 'ARCHER' | 'CROSSBOW' | 'ELITE_ARCHER';
export interface PromotionStep {
    readonly from: UnitClass;
    readonly to: UnitClass;
    readonly requiredExp: number;
    readonly requiredGold: number;
    readonly requiredTurns: number;
    readonly statBonus: Partial<OfficerStats>;
}
export interface UnitStats {
    readonly attack: number;
    readonly defense: number;
    readonly mobility: number;
    readonly range: number;
    readonly upkeep: number;
}
export declare class UnitPromotionManager {
    private promotions;
    /** 승급 가능 경로 조회 */
    getPromotionPath(currentClass: UnitClass): PromotionStep[];
    /** 무장 현재 병과 설정 */
    setUnitClass(officerId: OfficerID, unitClass: UnitClass): void;
    /** 숙련도 추가 */
    addExp(officerId: OfficerID, amount: number): number;
    /** 승급 실행 */
    promoteUnit(officerId: OfficerID, targetClass: UnitClass, availableGold: number): {
        success: boolean;
        statBonus: Partial<OfficerStats>;
        message: string;
    };
    /** 병과 스탯 조회 */
    getUnitStats(unitClass: UnitClass, officerStats: OfficerStats): UnitStats;
    /** 현재 병과 조회 */
    getCurrentClass(officerId: OfficerID): UnitClass | null;
    /** 현재 숙련도 조회 */
    getExp(officerId: OfficerID): number;
    getAllPromotionPaths(): PromotionStep[];
    clear(): void;
}
//# sourceMappingURL=unit_promotion_system.d.ts.map