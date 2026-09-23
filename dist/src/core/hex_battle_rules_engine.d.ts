/**
 * 삼국지 8 리메이크 — 고성능 A* 길찾기 및 전장 규칙 엔진
 * 파일: src/core/hex_battle_rules_engine.ts
 *
 * 설계 스펙 준수사항:
 * [Axial Coordinates] → q, r, s 축 좌표계를 활용한 헥사곤 거리 연산
 * [병종/지형 가중치]   → 기병, 보병별 지형 통과 MP Cost 실시간 계산
 * [ZOC 강제 정지]     → 적 유닛 인접 헥스 진입 시 잔여 이동력 소멸 규칙 적용
 * [보급선 연결 검사]   → BFS 기반 수도/거점 연결선 확인 및 단절 플래그 처리
 *
 * Python 원본: src/systems/pathfinding.py → TypeScript 포팅 + 확장
 * (기존 astar_hex_pathfinder.ts는 범용 A*이며, 이 파일은 병종/지형/ZOC/보급선
 *  전장 규칙을 통합한 전용 엔진)
 */
export type TerrainType = 'PLAINS' | 'RIVER' | 'MOUNTAIN' | 'WATER';
/** 헥스 그리드 단일 타일 정보 구조체 */
export interface HexTileInfo {
    q: number;
    r: number;
    /** Axial 좌표계 수식 검증: s = -q - r */
    s: number;
    terrainType: TerrainType;
    /** 고저차 (고원 판별용) */
    elevation: number;
}
export declare function makeHexTile(q: number, r: number, terrainType?: TerrainType, elevation?: number): HexTileInfo;
export type UnitType = 'HEAVY_CAVALRY' | 'SPECIAL_CAVALRY' | 'SPEARMAN' | 'LANCE_CAVALRY';
type HexKey = string;
export declare class HexBattleRulesEngine {
    /**
     * 병종 가중치와 지형 속성을 결합한 단일 타일 통과 비용 계산.
     * 고저차 및 경사지 보정 규칙 통합.
     */
    computeMoveCost(tile: HexTileInfo, unitType: UnitType): number;
    /** Axial 좌표계 기준 두 헥스 타일 간의 거리 (A* 휴리스틱용) */
    hexDistance(aq: number, ar: number, bq: number, br: number): number;
    /** 헥사곤 축 좌표계 기준 인접한 6방향 이웃 타일 좌표 반환 */
    getNeighbors(q: number, r: number): Array<[number, number]>;
    /**
     * [고성능 60fps A* 알고리즘]
     * ZOC 강제 정지 제약 조건을 실시간 계산에 포함하여 최적 전술 경로 도출 (< 5ms).
     *
     * @param start      시작 좌표 [q, r]
     * @param goal       목표 좌표 [q, r]
     * @param unitType   병종
     * @param gridMap    지도 (좌표 → 타일 정보)
     * @param enemyPositions 적 유닛 점유 좌표 집합 (ZOC 판정 근거)
     * @returns 최적 경로 배열 (시작 포함). 경로가 없으면 빈 배열
     */
    searchPath(start: [number, number], goal: [number, number], unitType: UnitType, gridMap: Map<HexKey, HexTileInfo>, enemyPositions: Set<HexKey>): Array<[number, number]>;
    /** 특정 헥스가 적 유닛의 ZOC(통제 영역) 안에 있는지 판정 */
    isInZOC(q: number, r: number, enemyPositions: Set<HexKey>): boolean;
    /**
     * [BFS 기반 실시간 보급선 검사 매니저]
     * 아군 유닛 위치에서 수도/보급거점까지 적군에게 차단당하지 않는
     * 연결 경로가 있는지 스캔합니다.
     *
     * @returns true = 보급선 유효 / false = 포위되어 보급선 단절 (is_supplied = false)
     */
    calculateSupplyLine(unitPos: [number, number], capitalPos: [number, number], gridMap: Map<HexKey, HexTileInfo>, enemyPositions: Set<HexKey>): boolean;
}
export {};
//# sourceMappingURL=hex_battle_rules_engine.d.ts.map