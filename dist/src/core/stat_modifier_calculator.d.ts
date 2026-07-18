/**
 * [Task 4] 동적 가변 능력치 계산기 — StatModifierCalculator
 *
 * 아이템 보너스, 질병 패널티, 노화 효과 등
 * 다양한 소스의 능력치 수정치를 계층적으로 적용.
 */
import type { OfficerID, OfficerStats } from "./types.js";
export type ModifierSource = "ITEM" | "DISEASE" | "AGING" | "BUFF" | "DEBUFF";
export type ModifierType = "ITEM_WEAPON" | "ITEM_MOUNT" | "ITEM_TREASURE" | "ITEM_BOOK" | "DISEASE" | "AGING" | "BUFF" | "DEBUFF";
export interface StatModifier {
    readonly id: string;
    readonly officerId: OfficerID;
    readonly type: ModifierType;
    readonly source: ModifierSource;
    readonly statKey: keyof OfficerStats;
    readonly value: number;
    readonly duration: number;
    turnsRemaining: number;
    readonly sourceId: string;
    readonly label: string;
    readonly appliedTurn: number;
}
export interface ModifierGroup {
    readonly officerId: OfficerID;
    readonly modifiers: StatModifier[];
    readonly netEffect: Partial<Record<keyof OfficerStats, number>>;
}
export declare class StatModifierCalculator {
    private modifiers;
    /**
     * 수정자 추가
     */
    addModifier(officerId: OfficerID, modifier: StatModifier): void;
    /**
     * sourceId로 수정자 제거
     */
    removeModifier(officerId: OfficerID, sourceId: string): boolean;
    /**
     * 모든 활성 수정자를 적용한 최종 능력치 계산
     */
    getEffectiveStats(officerId: OfficerID, baseStats: OfficerStats): OfficerStats;
    /**
     * 모든 수정자의 duration을 1 감소, 만료된 수정자 제거
     */
    tickAll(): void;
    /**
     * 특정 무장의 활성 수정자 목록
     */
    getActiveModifiers(officerId: OfficerID): StatModifier[];
    /**
     * 특정 무장의 모든 수정자 제거
     */
    clearOfficer(officerId: OfficerID): void;
}
//# sourceMappingURL=stat_modifier_calculator.d.ts.map