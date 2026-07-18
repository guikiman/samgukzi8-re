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
export declare class FogOfWarLOSPathfinder {
    /**
     * 특정 세력이 이번 턴에 볼 수 있는 가시 헥사곤 좌표 리스트를 스캔합니다.
     */
    calculateVisibleTiles(units: Map<string, BattleUnitState>, grid: Map<string, HexTileState>, factionUnitIds: string[], currentWeather: string, enemyUnits: BattleUnitState[]): VisibilityResult;
    /**
     * 큐브 헥사 좌표계 기반 원형 범위 스캔
     */
    private getHexCircle;
}
//# sourceMappingURL=fog_of_war_los_pathfinder.d.ts.map