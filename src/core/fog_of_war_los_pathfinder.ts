/**
 * [B7] 안개 시야 감쇄 및 유닛 은폐 — Fog of War LOS Pathfinder
 *
 * FogOfWarLOSPathfinder:
 *   1. 아군 부대 기준 가시 타일(LOS) 동적 스캔
 *   2. LOS 공식: 3 + floor(통솔/40) + floor(지력/50)
 *   3. FOG 날씨 시 LOS = 1
 *   4. 숲(FOREST) 타일 내 적 유닛은 인접 1타일 이내까지 감지 불가
 *   5. 큐브 헥사 좌표계 (x, y, z) 사용
 */

import type { HexTileState, BattleUnitState } from './hex_naval_state_resolver';

export interface VisibilityResult {
    readonly visibleTiles: Set<string>;
    readonly visibleEnemyUnitIds: string[];
    readonly hiddenEnemyUnitIds: string[];
}

export class FogOfWarLOSPathfinder {
    /**
     * 특정 세력이 이번 턴에 볼 수 있는 가시 헥사곤 좌표 리스트를 스캔합니다.
     */
    calculateVisibleTiles(
        units: Map<string, BattleUnitState>,
        grid: Map<string, HexTileState>,
        factionUnitIds: string[],
        currentWeather: string,
        enemyUnits: BattleUnitState[],
    ): VisibilityResult {
        const visibleSet = new Set<string>();
        const visibleEnemyIds: string[] = [];
        const hiddenEnemyIds: string[] = [];

        for (const unitId of factionUnitIds) {
            const unit = units.get(unitId);
            if (!unit) continue;

            let losRange = 3 + Math.floor(unit.stats.command / 40) + Math.floor(unit.stats.intelligence / 50);

            if (currentWeather === 'FOG') {
                losRange = 1;
            }

            const circleTiles = this.getHexCircle(grid, unit.x, unit.y, unit.z, losRange);
            for (const tileKey of circleTiles) {
                visibleSet.add(tileKey);
            }
        }

        // 적 유닛 가시성 판정
        for (const enemy of enemyUnits) {
            const enemyKey = `${enemy.x},${enemy.y},${enemy.z}`;
            if (visibleSet.has(enemyKey)) {
                const enemyTile = grid.get(enemyKey);
                // 숲 타일 내 적: 인접 1타일 이내까지 감지 불가
                if (enemyTile && enemyTile.type === 'FOREST') {
                    const isAdjacent = factionUnitIds.some(uid => {
                        const u = units.get(uid);
                        if (!u) return false;
                        const dist = Math.max(Math.abs(u.x - enemy.x), Math.abs(u.y - enemy.y), Math.abs(u.z - enemy.z));
                        return dist <= 1;
                    });
                    if (!isAdjacent) {
                        hiddenEnemyIds.push(enemy.id);
                        continue;
                    }
                }
                visibleEnemyIds.push(enemy.id);
            } else {
                hiddenEnemyIds.push(enemy.id);
            }
        }

        return { visibleTiles: visibleSet, visibleEnemyUnitIds: visibleEnemyIds, hiddenEnemyUnitIds: hiddenEnemyIds };
    }

    /**
     * 큐브 헥사 좌표계 기반 원형 범위 스캔
     */
    private getHexCircle(
        grid: Map<string, HexTileState>,
        cx: number,
        cy: number,
        cz: number,
        radius: number,
    ): string[] {
        const results: string[] = [];
        for (let q = -radius; q <= radius; q++) {
            for (let r = Math.max(-radius, -q - radius); r <= Math.min(radius, -q + radius); r++) {
                const s = -q - r;
                const targetX = cx + q;
                const targetY = cy + r;
                const targetZ = cz + s;
                const key = `${targetX},${targetY},${targetZ}`;
                if (grid.has(key)) {
                    results.push(key);
                }
            }
        }
        return results;
    }
}
