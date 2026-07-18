/**
 * [B20] 지형 패널티 및 방어 가중치 공식 처리기 — TerrainModifierResolver
 *
 * 목적: 헥사 타일의 물리 지형(평지, 숲, 산악, 늪지 등)이
 *       부대 기동력 및 전투 성능에 주는 보정치 정규화.
 *
 * 핵심 로직:
 *   1. 기병 → 숲: 이동비용 2배, 전법 공격력 -20%
 *   2. 보병 → 산악: 방어력 15% 가중치
 */
const TERRAIN_BASE = {
    PLAIN: { moveCost: 1, attackPenalty: 0, defenseBonus: 0, avoidBonus: 0 },
    FOREST: { moveCost: 2, attackPenalty: 10, defenseBonus: 10, avoidBonus: 15 },
    MOUNTAIN: { moveCost: 3, attackPenalty: 5, defenseBonus: 20, avoidBonus: 5 },
    WATER: { moveCost: 4, attackPenalty: 20, defenseBonus: -10, avoidBonus: -10 },
    MARSH: { moveCost: 3, attackPenalty: 15, defenseBonus: -5, avoidBonus: -5 },
    DESERT: { moveCost: 2, attackPenalty: 5, defenseBonus: -5, avoidBonus: 0 },
    CITY: { moveCost: 1, attackPenalty: 0, defenseBonus: 15, avoidBonus: 10 },
};
const UNIT_CLASS_MODIFIERS = {
    INFANTRY: {
        FOREST: { moveCost: 1, attackPenalty: 0, defenseBonus: 5, avoidBonus: 5 },
        MOUNTAIN: { moveCost: 2, attackPenalty: 0, defenseBonus: 15, avoidBonus: 0 },
    },
    CAVALRY: {
        FOREST: { moveCost: 2, attackPenalty: 20, defenseBonus: 0, avoidBonus: -5 },
        MOUNTAIN: { moveCost: 4, attackPenalty: 25, defenseBonus: -10, avoidBonus: -10 },
        MARSH: { moveCost: 3, attackPenalty: 15, defenseBonus: -10, avoidBonus: -10 },
    },
    ARCHER: {
        MOUNTAIN: { moveCost: 3, attackPenalty: 0, defenseBonus: 5, avoidBonus: 0 },
        FOREST: { moveCost: 2, attackPenalty: -10, defenseBonus: 5, avoidBonus: 10 },
    },
    SIEGE: {
        MOUNTAIN: { moveCost: 5, attackPenalty: 10, defenseBonus: 0, avoidBonus: -10 },
        FOREST: { moveCost: 3, attackPenalty: 5, defenseBonus: 0, avoidBonus: -5 },
    },
    NAVAL: {
        WATER: { moveCost: 1, attackPenalty: 0, defenseBonus: 0, avoidBonus: 0 },
        PLAIN: { moveCost: 99, attackPenalty: 50, defenseBonus: -30, avoidBonus: -20 },
    },
};
export class TerrainModifierResolver {
    /**
     * 주어진 지형 + 병과에 대한 최종 보정치 계산
     */
    resolve(terrain, unitClass) {
        const base = { ...TERRAIN_BASE[terrain] };
        const unitMod = UNIT_CLASS_MODIFIERS[unitClass][terrain];
        if (unitMod) {
            base.moveCost = unitMod.moveCost ?? base.moveCost;
            base.attackPenalty = unitMod.attackPenalty ?? base.attackPenalty;
            base.defenseBonus = unitMod.defenseBonus ?? base.defenseBonus;
            base.avoidBonus = unitMod.avoidBonus ?? base.avoidBonus;
        }
        return base;
    }
    /** 이동 가능 여부 (이동코스트가 99면 통과 불가) */
    canMove(terrain, unitClass) {
        return this.resolve(terrain, unitClass).moveCost < 99;
    }
    /** 공격력 패널티 계수 (1.0 = 기본, 0.8 = -20%) */
    getAttackModifier(terrain, unitClass) {
        const mod = this.resolve(terrain, unitClass);
        return Math.max(0.5, 1 - mod.attackPenalty / 100);
    }
    /** 방어력 보정 계수 */
    getDefenseModifier(terrain, unitClass) {
        const mod = this.resolve(terrain, unitClass);
        return Math.max(0.5, 1 + mod.defenseBonus / 100);
    }
}
//# sourceMappingURL=terrain_modifier_resolver.js.map