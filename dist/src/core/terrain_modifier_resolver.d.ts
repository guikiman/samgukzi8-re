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
export type TerrainType = 'PLAIN' | 'FOREST' | 'MOUNTAIN' | 'WATER' | 'MARSH' | 'DESERT' | 'CITY';
export type UnitClass = 'INFANTRY' | 'CAVALRY' | 'ARCHER' | 'SIEGE' | 'NAVAL';
export interface TerrainModifier {
    readonly moveCost: number;
    readonly attackPenalty: number;
    readonly defenseBonus: number;
    readonly avoidBonus: number;
}
export declare class TerrainModifierResolver {
    /**
     * 주어진 지형 + 병과에 대한 최종 보정치 계산
     */
    resolve(terrain: TerrainType, unitClass: UnitClass): TerrainModifier;
    /** 이동 가능 여부 (이동코스트가 99면 통과 불가) */
    canMove(terrain: TerrainType, unitClass: UnitClass): boolean;
    /** 공격력 패널티 계수 (1.0 = 기본, 0.8 = -20%) */
    getAttackModifier(terrain: TerrainType, unitClass: UnitClass): number;
    /** 방어력 보정 계수 */
    getDefenseModifier(terrain: TerrainType, unitClass: UnitClass): number;
}
//# sourceMappingURL=terrain_modifier_resolver.d.ts.map