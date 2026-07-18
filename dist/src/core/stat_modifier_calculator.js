/**
 * [Task 4] 동적 가변 능력치 계산기 — StatModifierCalculator
 *
 * 아이템 보너스, 질병 패널티, 노화 효과 등
 * 다양한 소스의 능력치 수정치를 계층적으로 적용.
 */
// ============================================================
// StatModifierCalculator
// ============================================================
export class StatModifierCalculator {
    constructor() {
        this.modifiers = new Map();
    }
    /**
     * 수정자 추가
     */
    addModifier(officerId, modifier) {
        const list = this.modifiers.get(officerId) ?? [];
        list.push({ ...modifier });
        this.modifiers.set(officerId, list);
    }
    /**
     * sourceId로 수정자 제거
     */
    removeModifier(officerId, sourceId) {
        const list = this.modifiers.get(officerId);
        if (!list)
            return false;
        const filtered = list.filter((m) => m.sourceId !== sourceId);
        if (filtered.length === list.length)
            return false;
        if (filtered.length === 0) {
            this.modifiers.delete(officerId);
        }
        else {
            this.modifiers.set(officerId, filtered);
        }
        return true;
    }
    /**
     * 모든 활성 수정자를 적용한 최종 능력치 계산
     */
    getEffectiveStats(officerId, baseStats) {
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
    tickAll() {
        for (const [officerId, mods] of this.modifiers) {
            const alive = mods.filter((m) => {
                m.turnsRemaining -= 1;
                return m.turnsRemaining > 0;
            });
            if (alive.length === 0) {
                this.modifiers.delete(officerId);
            }
            else {
                this.modifiers.set(officerId, alive);
            }
        }
    }
    /**
     * 특정 무장의 활성 수정자 목록
     */
    getActiveModifiers(officerId) {
        return this.modifiers.get(officerId) ?? [];
    }
    /**
     * 특정 무장의 모든 수정자 제거
     */
    clearOfficer(officerId) {
        this.modifiers.delete(officerId);
    }
}
//# sourceMappingURL=stat_modifier_calculator.js.map