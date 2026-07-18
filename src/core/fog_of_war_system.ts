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

const WEATHER_VISIBILITY: Record<VisibilityWeather, number> = {
    SUNNY: 10, CLOUDY: 8, RAIN: 5, SNOW: 4, STORM: 2, FOG: 2,
};

const TIME_VISIBILITY: Record<TimeOfDay, number> = {
    DAWN: 0.7, DAY: 1.0, DUSK: 0.6, NIGHT: 0.4,
};

const TERRAIN_VISIBILITY_BONUS: Record<TerrainType, number> = {
    PLAIN: 0, FOREST: -2, MOUNTAIN: 2, RIVER: 0, SWAMP: -1, DESERT: 1, CITY: 1,
};

function coordKey(c: HexCoord): string {
    return `${c.q},${c.r}`;
}

export class FogOfWarManager {
    private exploredTiles: Set<string> = new Set();
    private visibleTiles: Set<string> = new Set();
    private currentWeather: VisibilityWeather = 'SUNNY';
    private currentTimeOfDay: TimeOfDay = 'DAY';

    setWeather(weather: VisibilityWeather): void {
        this.currentWeather = weather;
    }

    getWeather(): VisibilityWeather {
        return this.currentWeather;
    }

    setTimeOfDay(time: TimeOfDay): void {
        this.currentTimeOfDay = time;
    }

    getTimeOfDay(): TimeOfDay {
        return this.currentTimeOfDay;
    }

    getVisibilityRadius(unitType?: string, weather?: VisibilityWeather, timeOfDay?: TimeOfDay): number {
        const w = weather ?? this.currentWeather;
        const t = timeOfDay ?? this.currentTimeOfDay;

        let baseRadius = WEATHER_VISIBILITY[w];
        const timeFactor = TIME_VISIBILITY[t];

        // unitType bonus
        const unitBonus: Record<string, number> = {
            INFANTRY: 0, CAVALRY: 1, ARCHER: 2, SIEGE: 0, NAVAL: 3,
        };
        baseRadius += unitBonus[unitType ?? 'INFANTRY'] ?? 0;

        return Math.max(1, Math.floor(baseRadius * timeFactor));
    }

    getTerrainVisibilityBonus(terrain: TerrainType): number {
        return TERRAIN_VISIBILITY_BONUS[terrain];
    }

    /** 헥사곤 좌표 주변 시야 계산 (맨해튼 거리 기반) */
    private getTilesInRadius(center: HexCoord, radius: number): string[] {
        const tiles: string[] = [];
        for (let dq = -radius; dq <= radius; dq++) {
            for (let dr = -radius; dr <= radius; dr++) {
                const dist = Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr));
                if (dist <= radius) {
                    tiles.push(coordKey({ q: center.q + dq, r: center.r + dr }));
                }
            }
        }
        return tiles;
    }

    /** 시야 업데이트 */
    updateVisibility(
        unitPositions: UnitPosition[],
        terrainMap?: Map<string, TerrainType>,
    ): void {
        this.visibleTiles.clear();

        for (const unit of unitPositions) {
            const baseRadius = this.getVisibilityRadius(unit.unitType);
            let effectiveRadius = baseRadius;

            // 지형 보정
            if (terrainMap) {
                const terrain = terrainMap.get(coordKey(unit.coord));
                if (terrain) {
                    effectiveRadius += this.getTerrainVisibilityBonus(terrain);
                }
            }

            const tiles = this.getTilesInRadius(unit.coord, Math.max(1, effectiveRadius));
            for (const tile of tiles) {
                this.visibleTiles.add(tile);
                this.exploredTiles.add(tile);
            }
        }
    }

    isTileVisible(coord: HexCoord): boolean {
        return this.visibleTiles.has(coordKey(coord));
    }

    isTileExplored(coord: HexCoord): boolean {
        return this.exploredTiles.has(coordKey(coord));
    }

    getVisibleTiles(): string[] {
        return Array.from(this.visibleTiles);
    }

    getExploredTiles(): string[] {
        return Array.from(this.exploredTiles);
    }

    resetExploration(): void {
        this.exploredTiles.clear();
        this.visibleTiles.clear();
    }
}
