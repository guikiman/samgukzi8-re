/**
 * [B13] 수역/함선 상성 시스템 — Naval Combat System
 *
 * ShipType: TRANSPORT | PATROL | WARSHIP | MENGCHONG | LOUSCHUAN
 * 함선 상성: LOUSCHUAN > MENGCHONG > WARSHIP > PATROL > TRANSPORT
 * 날씨 영향: 폭풍 이동력 -50%, 안개 시야 -70%
 */
import type { OfficerStats } from './types';
export type ShipType = 'TRANSPORT' | 'PATROL' | 'WARSHIP' | 'MENGCHONG' | 'LOUSCHUAN';
export type NavalTerrain = 'RIVER' | 'SEA' | 'SWAMP' | 'LAKE' | 'SHALLOW';
export interface ShipDef {
    readonly type: ShipType;
    readonly name: string;
    readonly speed: number;
    readonly defense: number;
    readonly attack: number;
    readonly capacity: number;
    readonly cost: number;
    readonly special: string;
}
export type BattleWeather = 'SUNNY' | 'CLOUDY' | 'RAIN' | 'SNOW' | 'STORM' | 'FOG';
export declare class NavalCombatSystem {
    getShipStats(shipType: ShipType): ShipDef;
    getAllShipTypes(): ShipDef[];
    getShipCounter(attackerType: ShipType, defenderType: ShipType): number;
    calculateNavalDamage(attackerShip: ShipType, defenderShip: ShipType, attackerStats: OfficerStats, _defenderStats: OfficerStats, weather: BattleWeather): number;
    getTerrainPenalty(shipType: ShipType, terrainType: NavalTerrain): number;
    getMovementCost(shipType: ShipType, terrainType: NavalTerrain, weather: BattleWeather): number;
    getVisionRange(shipType: ShipType, weather: BattleWeather): number;
}
//# sourceMappingURL=naval_combat_system.d.ts.map