/**
 * [B20] 병과 승급 시스템 — Unit Promotion System
 *
 * 승급 트리:
 *   INFANTRY → HEAVY_INFANTRY → ELITE_INFANTRY  (100/300/600 exp)
 *   CAVALRY → HEAVY_CAVALRY → ELITE_CAVALRY      (100/300/600 exp)
 *   ARCHER → CROSSBOW → ELITE_ARCHER               (100/300/600 exp)
 * 각 승급: 금 200→500→1000
 */
const PROMOTION_TREE = [
    { from: 'INFANTRY', to: 'HEAVY_INFANTRY', requiredExp: 100, requiredGold: 200, requiredTurns: 2, statBonus: { might: 5, leadership: 3 } },
    { from: 'HEAVY_INFANTRY', to: 'ELITE_INFANTRY', requiredExp: 300, requiredGold: 500, requiredTurns: 3, statBonus: { might: 8, leadership: 5, charisma: 2 } },
    { from: 'CAVALRY', to: 'HEAVY_CAVALRY', requiredExp: 100, requiredGold: 200, requiredTurns: 2, statBonus: { might: 5, leadership: 2 } },
    { from: 'HEAVY_CAVALRY', to: 'ELITE_CAVALRY', requiredExp: 300, requiredGold: 500, requiredTurns: 3, statBonus: { might: 8, leadership: 4, charisma: 2 } },
    { from: 'ARCHER', to: 'CROSSBOW', requiredExp: 100, requiredGold: 200, requiredTurns: 2, statBonus: { intelligence: 3, leadership: 2 } },
    { from: 'CROSSBOW', to: 'ELITE_ARCHER', requiredExp: 300, requiredGold: 500, requiredTurns: 3, statBonus: { intelligence: 6, leadership: 4, politics: 2 } },
];
const UNIT_BASE_STATS = {
    INFANTRY: { attack: 10, defense: 10, mobility: 3, range: 1, upkeep: 10 },
    HEAVY_INFANTRY: { attack: 15, defense: 18, mobility: 2, range: 1, upkeep: 20 },
    ELITE_INFANTRY: { attack: 22, defense: 25, mobility: 3, range: 1, upkeep: 35 },
    CAVALRY: { attack: 12, defense: 8, mobility: 5, range: 1, upkeep: 15 },
    HEAVY_CAVALRY: { attack: 18, defense: 14, mobility: 4, range: 1, upkeep: 30 },
    ELITE_CAVALRY: { attack: 28, defense: 20, mobility: 5, range: 1, upkeep: 50 },
    ARCHER: { attack: 12, defense: 6, mobility: 3, range: 3, upkeep: 12 },
    CROSSBOW: { attack: 18, defense: 10, mobility: 2, range: 4, upkeep: 25 },
    ELITE_ARCHER: { attack: 25, defense: 14, mobility: 3, range: 5, upkeep: 40 },
};
export class UnitPromotionManager {
    constructor() {
        this.promotions = new Map();
    }
    /** 승급 가능 경로 조회 */
    getPromotionPath(currentClass) {
        return PROMOTION_TREE.filter(p => p.from === currentClass);
    }
    /** 무장 현재 병과 설정 */
    setUnitClass(officerId, unitClass) {
        this.promotions.set(officerId, { currentClass: unitClass, exp: 0 });
    }
    /** 숙련도 추가 */
    addExp(officerId, amount) {
        const entry = this.promotions.get(officerId);
        if (!entry)
            return 0;
        entry.exp += amount;
        this.promotions.set(officerId, entry);
        return entry.exp;
    }
    /** 승급 실행 */
    promoteUnit(officerId, targetClass, availableGold) {
        const entry = this.promotions.get(officerId);
        if (!entry) {
            return { success: false, statBonus: {}, message: '병과 정보 없음.' };
        }
        const path = this.getPromotionPath(entry.currentClass).find(p => p.to === targetClass);
        if (!path) {
            return { success: false, statBonus: {}, message: '유효하지 않은 승급 경로.' };
        }
        if (entry.exp < path.requiredExp) {
            return { success: false, statBonus: {}, message: `숙련도 부족 (${entry.exp}/${path.requiredExp}).` };
        }
        if (availableGold < path.requiredGold) {
            return { success: false, statBonus: {}, message: `금 부족 (${availableGold}/${path.requiredGold}).` };
        }
        // 승급 실행
        this.promotions.set(officerId, { currentClass: targetClass, exp: 0 });
        return {
            success: true,
            statBonus: { ...path.statBonus },
            message: `${targetClass}로 승급 성공! (${path.requiredGold}금 소모)`,
        };
    }
    /** 병과 스탯 조회 */
    getUnitStats(unitClass, officerStats) {
        const base = UNIT_BASE_STATS[unitClass];
        const leadershipBonus = Math.floor(officerStats.leadership / 20);
        return {
            attack: base.attack + leadershipBonus,
            defense: base.defense + Math.floor(officerStats.might / 20),
            mobility: base.mobility,
            range: base.range,
            upkeep: base.upkeep,
        };
    }
    /** 현재 병과 조회 */
    getCurrentClass(officerId) {
        return this.promotions.get(officerId)?.currentClass ?? null;
    }
    /** 현재 숙련도 조회 */
    getExp(officerId) {
        return this.promotions.get(officerId)?.exp ?? 0;
    }
    getAllPromotionPaths() {
        return [...PROMOTION_TREE];
    }
    clear() {
        this.promotions.clear();
    }
}
//# sourceMappingURL=unit_promotion_system.js.map