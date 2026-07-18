/**
 * [B14] 안개/Fog of War + 기후 연동 시스템
 *
 * FogOfWarManager:
 *   - 시야 반경 = baseRadius × 날씨계수 × 시간계수
 *     맑음=10, 비=7, 안개=3, 폭풍=2, 눈=5
 *   - 낮=100%, 밤=60%
 *   - 지형: 산=+2, 숲=-2
 */
import type { HexCoord } from './types';
export type VisibilityWeather = 'SUNNY' | 'CLOUDY' | 'RAIN' | 'SNOW' | 'STORM' | 'FOG';
export type TimeOfDay = 'DAWN' | 'DAY' | 'DUSK' | 'NIGHT';
export type TerrainType = 'PLAIN' | 'FOREST' | 'MOUNTAIN' | 'RIVER' | 'SWAMP' | 'DESERT' | 'CITY';
export interface UnitPosition {
    readonly unitId: string;
    readonly coord: HexCoord;
    readonly unitType: 'INFANTRY' | 'CAVALRY' | 'ARCHER' | 'SIEGE' | 'NAVAL';
}
export interface FogOfWarState {
    readonly visibleTiles: string[];
    readonly exploredTiles: Set<string>;
    readonly weather: VisibilityWeather;
    readonly timeOfDay: TimeOfDay;
    readonly visibilityRadius: number;
}
export declare class FogOfWarManager {
    private exploredTiles;
    private visibleTiles;
    private currentWeather;
    private currentTimeOfDay;
    setWeather(weather: VisibilityWeather): void;
    getWeather(): VisibilityWeather;
    setTimeOfDay(time: TimeOfDay): void;
    getTimeOfDay(): TimeOfDay;
    getVisibilityRadius(unitType?: string, weather?: VisibilityWeather, timeOfDay?: TimeOfDay): number;
    getTerrainVisibilityBonus(terrain: TerrainType): number;
    /** 헥사곤 좌표 주변 시야 계산 (맨해튼 거리 기반) */
    private getTilesInRadius;
    /** 시야 업데이트 */
    updateVisibility(unitPositions: UnitPosition[], terrainMap?: Map<string, TerrainType>): void;
    isTileVisible(coord: HexCoord): boolean;
    isTileExplored(coord: HexCoord): boolean;
    getVisibleTiles(): string[];
    getExploredTiles(): string[];
    resetExploration(): void;
}
//# sourceMappingURL=fog_of_war_system.d.ts.map