/**
 * [B14] 안개/Fog of War + 기후 연동 시스템
 *
 * FogOfWarManager:
 *   - 시야 반경 = baseRadius × 날씨계수 × 시간계수
 *     맑음=10, 비=7, 안개=3, 폭풍=2, 눈=5
 *   - 낮=100%, 밤=60%
 *   - 지형: 산=+2, 숲=-2
 */
const WEATHER_VISIBILITY = {
    SUNNY: 10, CLOUDY: 8, RAIN: 5, SNOW: 4, STORM: 2, FOG: 2,
};
const TIME_VISIBILITY = {
    DAWN: 0.7, DAY: 1.0, DUSK: 0.6, NIGHT: 0.4,
};
const TERRAIN_VISIBILITY_BONUS = {
    PLAIN: 0, FOREST: -2, MOUNTAIN: 2, RIVER: 0, SWAMP: -1, DESERT: 1, CITY: 1,
};
function coordKey(c) {
    return `${c.q},${c.r}`;
}
export class FogOfWarManager {
    constructor() {
        this.exploredTiles = new Set();
        this.visibleTiles = new Set();
        this.currentWeather = 'SUNNY';
        this.currentTimeOfDay = 'DAY';
    }
    setWeather(weather) {
        this.currentWeather = weather;
    }
    getWeather() {
        return this.currentWeather;
    }
    setTimeOfDay(time) {
        this.currentTimeOfDay = time;
    }
    getTimeOfDay() {
        return this.currentTimeOfDay;
    }
    getVisibilityRadius(unitType, weather, timeOfDay) {
        const w = weather ?? this.currentWeather;
        const t = timeOfDay ?? this.currentTimeOfDay;
        let baseRadius = WEATHER_VISIBILITY[w];
        const timeFactor = TIME_VISIBILITY[t];
        // unitType bonus
        const unitBonus = {
            INFANTRY: 0, CAVALRY: 1, ARCHER: 2, SIEGE: 0, NAVAL: 3,
        };
        baseRadius += unitBonus[unitType ?? 'INFANTRY'] ?? 0;
        return Math.max(1, Math.floor(baseRadius * timeFactor));
    }
    getTerrainVisibilityBonus(terrain) {
        return TERRAIN_VISIBILITY_BONUS[terrain];
    }
    /** 헥사곤 좌표 주변 시야 계산 (맨해튼 거리 기반) */
    getTilesInRadius(center, radius) {
        const tiles = [];
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
    updateVisibility(unitPositions, terrainMap) {
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
    isTileVisible(coord) {
        return this.visibleTiles.has(coordKey(coord));
    }
    isTileExplored(coord) {
        return this.exploredTiles.has(coordKey(coord));
    }
    getVisibleTiles() {
        return Array.from(this.visibleTiles);
    }
    getExploredTiles() {
        return Array.from(this.exploredTiles);
    }
    resetExploration() {
        this.exploredTiles.clear();
        this.visibleTiles.clear();
    }
}
//# sourceMappingURL=fog_of_war_system.js.map