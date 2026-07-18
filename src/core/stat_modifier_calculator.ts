/**
 * [Task 4] 동적 가변 능력치 계산기 — StatModifierCalculator
 *
 * 아이템 보너스, 질병 패널티, 노화 효과 등
 * 다양한 소스의 능력치 수정치를 계층적으로 적용.
 */

import type { OfficerID, OfficerStats } from "./types.js";

// ============================================================
// 타입 정의
// ============================================================

export type ModifierSource = "ITEM" | "DISEASE" | "AGING" | "BUFF" | "DEBUFF";

export type ModifierType =
  | "ITEM_WEAPON"
  | "ITEM_MOUNT"
  | "ITEM_TREASURE"
  | "ITEM_BOOK"
  | "DISEASE"
  | "AGING"
  | "BUFF"
  | "DEBUFF";

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

// ============================================================
// StatModifierCalculator
// ============================================================

export class StatModifierCalculator {
  private modifiers = new Map<OfficerID, StatModifier[]>();

  /**
   * 수정자 추가
   */
  addModifier(officerId: OfficerID, modifier: StatModifier): void {
    const list = this.modifiers.get(officerId) ?? [];
    list.push({ ...modifier });
    this.modifiers.set(officerId, list);
  }

  /**
   * sourceId로 수정자 제거
   */
  removeModifier(officerId: OfficerID, sourceId: string): boolean {
    const list = this.modifiers.get(officerId);
    if (!list) return false;
    const filtered = list.filter((m) => m.sourceId !== sourceId);
    if (filtered.length === list.length) return false;
    if (filtered.length === 0) {
      this.modifiers.delete(officerId);
    } else {
      this.modifiers.set(officerId, filtered);
    }
    return true;
  }

  /**
   * 모든 활성 수정자를 적용한 최종 능력치 계산
   */
  getEffectiveStats(officerId: OfficerID, baseStats: OfficerStats): OfficerStats {
    const mods = this.modifiers.get(officerId) ?? [];
    const result = { ...baseStats };
    for (const mod of mods) {
      const key = mod.statKey;
      result[key] = Math.max(0, Math.min(200, result[key] + mod.value));
    }
    return result;
  }

  /**
   * 모든 수정자의 duration을 1 감소, 만료된 수정자 제거
   */
  tickAll(): void {
    for (const [officerId, mods] of this.modifiers) {
      const alive = mods.filter((m) => {
        m.turnsRemaining -= 1;
        return m.turnsRemaining > 0;
      });
      if (alive.length === 0) {
        this.modifiers.delete(officerId);
      } else {
        this.modifiers.set(officerId, alive);
      }
    }
  }

  /**
   * 특정 무장의 활성 수정자 목록
   */
  getActiveModifiers(officerId: OfficerID): StatModifier[] {
    return this.modifiers.get(officerId) ?? [];
  }

  /**
   * 특정 무장의 모든 수정자 제거
   */
  clearOfficer(officerId: OfficerID): void {
    this.modifiers.delete(officerId);
  }
}