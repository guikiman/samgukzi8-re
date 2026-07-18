/**
 * [B19] 화공 화염 확산 시뮬레이터 — FireSpreadSimulator
 *
 * 목적: 맵 내 발화된 타일이 풍향, 풍속, 타일 지형 속성에 따라
 *       실시간으로 번져나가는 세포 자동자(Cellular Automata) 알고리즘.
 *
 * 핵심 로직:
 *   1. 매 턴 종료 시 불타는 타일의 인접 타일 추출
 *   2. 숲(FOREST) + 바람 방향 일치 시 발화율 80%
 *   3. 위에 서 있는 부대 턴당 고정 데미지
 */
export type TileTerrain = 'PLAIN' | 'FOREST' | 'MOUNTAIN' | 'WATER' | 'MARSH' | 'CITY' | 'DESERT';
export interface FireTile {
    readonly q: number;
    readonly r: number;
    readonly intensity: number;
    readonly turnsBurning: number;
    readonly terrain: TileTerrain;
}
export interface FireSpreadResult {
    readonly newFireTiles: FireTile[];
    readonly extinguishedTiles: FireTile[];
    readonly unitDamageMap: Map<string, number>;
}
export declare class FireSpreadSimulator {
    private burningTiles;
    /**
     * 매 턴 화염 확산 처리
     *
     * @param windDx    - 풍향 x 성분 (-1~1)
     * @param windDy    - 풍향 y 성분 (-1~1)
     * @param unitPositions - "q,r" → unitId 맵 (화염 데미지용)
     */
    simulateSpread(windDx: number, windDy: number, terrainMap: Map<string, TileTerrain>, unitPositions: Map<string, string>): FireSpreadResult;
    /** 특정 타일 발화 (화공 전법 등) */
    ignite(q: number, r: number, terrain: TileTerrain, intensity?: number): boolean;
    /** 현재 불타는 타일 목록 */
    getBurningTiles(): FireTile[];
    /** 전장 초기화 */
    clearAll(): void;
}
//# sourceMappingURL=fire_spread_simulator.d.ts.map