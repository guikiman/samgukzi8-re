/**
 * 삼국지 8 리메이크 — 헥사곤 전술 전투 물리 계산기 및 대미지 밸런싱 시스템
 * 파일: src/core/battle_calculations.ts
 *
 * 핵수 수학 공식:
 * 1. ZOC (Zone of Control) 이동 불가 판정
 * 2. 기본 전투 및 전법 대미지 공식:
 *    D = (BaseAttack × Might_Attacker / Defense_Defender) × TerrainPenalty × WeatherFactor + ChainBonus
 * 3. 인접 상생/의형제/배우자 연격 체인:
 *    ChainBonus = Σ (BaseAttack × 0.4 × RelationshipMultiplier)
 *    (의형제: 1.5, 배우자: 1.3, 상생: 1.1)
 */
import { HexCoord, Weather, RelationType, OfficerID, Officer, RelationshipEdge } from './types.js';
export type UnitType = 'INFANTRY' | 'CAVALRY' | 'ARCHER' | 'SIEGE';
export type TerrainType = 'PLAINS' | 'FOREST' | 'MOUNTAIN' | 'RIVER' | 'MARSH' | 'DESERT' | 'WATER';
export interface BattleTile {
    q: number;
    r: number;
    terrain: TerrainType;
    elevation: number;
    defense: number;
    hasForestCover: boolean;
    isRiverCrossing: boolean;
}
export interface BattleUnit {
    unitId: string;
    officerId: OfficerID;
    unitType: UnitType;
    soldiers: number;
    morale: number;
    training: number;
    position: HexCoord;
    facing: number;
    isSupplied: boolean;
    baseAttack: number;
    baseDefense: number;
    movementPoints: number;
    maxMovementPoints: number;
    hasEvasionSkill: boolean;
    evasionProbability: number;
}
export interface AttackerInfo {
    unit: BattleUnit;
    officer: Officer;
    tile: BattleTile;
}
export interface DefenderInfo {
    unit: BattleUnit;
    officer: Officer;
    tile: BattleTile;
}
export interface DamageResult {
    baseDamage: number;
    terrainPenalty: number;
    weatherFactor: number;
    typeMatchupMultiplier: number;
    elevationBonus: number;
    chainBonus: number;
    totalDamage: number;
    isCritical: boolean;
    details: string[];
}
export interface ChainParticipant {
    unit: BattleUnit;
    officer: Officer;
    relationType: RelationType;
    relationshipMultiplier: number;
    contribution: number;
}
export interface ZOCResult {
    isCut: boolean;
    zocSources: HexCoord[];
    evaded: boolean;
    reason: string;
}
export declare const HEX_DIRECTIONS: readonly HexCoord[];
export declare class BattleCalculationsEngine {
    private tiles;
    private relationships;
    private weather;
    constructor(tiles: BattleTile[], relationships: RelationshipEdge[], weather: Weather);
    private tileKey;
    /**
     * Axial 좌표계 기반 두 헥스 타일 간의 거리 계산
     * Hex distance = (|dq| + |dr| + |dq + dr|) / 2
     * s = -q - r 이므로 |ds| = |dq + dr|
     */
    calculateHexDistance(a: HexCoord, b: HexCoord): number;
    getHexNeighbors(coord: HexCoord): HexCoord[];
    getTile(q: number, r: number): BattleTile | null;
    /**
     * 적 부대가 위치한 헥스의 인접 6개 타일 벡터 영역을 탐색하여,
     * 아군 유닛이 이 영역에 진입하는 순간 남은 이동력(AP)에 관계없이
     * 기동을 강제 정지시키고, 회피 특기가 있을 때만 일정 확률로 무시.
     *
     * ZOC 판정 로직:
     * 1. 목적지 헥스의 6방향 인접 타일에 적 유닛이 있는지 탐색
     * 2. 적 유닛이 인접하면 ZOC 발동 → 이동 강제 정지
     * 3. 회피 특기(hasEvasionSkill)가 있으면 evasionProbability 확률로 ZOC 무시
     *
     * @param targetHex - 이동하려는 목적지 헥스
     * @param enemyPositions - 적 유닛들의 위치 배열
     * @param movingUnit - 이동 중인 아군 유닛
     */
    isZOCCut(targetHex: HexCoord, enemyPositions: HexCoord[], movingUnit: BattleUnit): ZOCResult;
    /**
     * 대미지 공식:
     * D = (BaseAttack × Might_Attacker / Defense_Defender) × TerrainPenalty × WeatherFactor + ChainBonus
     *
     * 추가 가중치:
     * - 병과 상성: 보병 → 기병 → 궁병 → 보병 (가위바위보)
     * - 고지대 버프: 공격자 타일 높이 > 방어자 타일 높이일 때
     *   고도 1m당 사거리 +1, 대미지 +15%
     *
     * 부동 소수점 오차 및 0으로 나누기 방지:
     * - Defense가 0일 때 최소값 1로 clamping
     * - 모든 곱셈 후 반올림하여 정수화
     */
    calculateDamage(attacker: AttackerInfo, defender: DefenderInfo, chainBonus: number): DamageResult;
    /**
     * 지형별 방어 가중치:
     * - PLAINS: 1.0 (기본)
     * - FOREST: 0.8 (보병 공격 시 0.7, 숲 엄폐)
     * - MOUNTAIN: 0.6 (산악 방어 우세)
     * - RIVER: 0.9 (강 도하 중)
     * - MARSH: 0.7 (습지)
     * - DESERT: 1.0
     * - WATER: 0.5 (수상)
     *
     * 방어자 타일의 defense 수치도 추가 반영
     */
    private calculateTerrainPenalty;
    /**
     * 날씨별 전투 효율 계수:
     * - SUNNY: 1.0 (기본)
     * - CLOUDY: 0.98
     * - RAIN: 궁병 0.7, 기병 0.85, 보병 0.95
     * - SNOW: 궁병 0.5, 기병 0.6, 보병 0.8
     * - STORM: 모든 병과 0.5
     * - FOG: 궁병 0.4, 기병 0.9, 보병 0.9
     */
    private calculateWeatherFactor;
    /**
     * 병과 상성:
     * - 보병(INFANTRY) → 기병(CAVALRY): 1.5배 (창병이 기병에 강함)
     * - 기병(CAVALRY) → 궁병(ARCHER): 1.5배 (기병이 궁병에 강함)
     * - 궁병(ARCHER) → 보병(INFANTRY): 1.5배 (궁병이 보병에 강함)
     * - 같은 병과: 1.0배
     * - 공성병(SIEGE): 모든 보병/기병에 0.8배, 궁병에 1.2배
     */
    private calculateTypeMatchup;
    /**
     * 공격자 타일 높이 > 방어자 타일 높이일 때:
     * - 고도 1m당 사거리 +1 (별도 처리)
     * - 대미지 +15% per 1m 고도차
     *
     * elevationBonus = 1 + (attackerElev - defenderElev) × 0.15
     * 단, attackerElev > defenderElev일 때만 적용
     */
    private calculateElevationBonus;
    /**
     * 고도차에 따른 사거리 보너스 (1m당 +1 사거리)
     */
    calculateRangeBonus(attackerTile: BattleTile, defenderTile: BattleTile): number;
    private checkCritical;
    /**
     * 공격 대상 적 유닛 주변 헥스에 아군 공격자와 '상생', '의형제', '배우자'
     * 관계를 가진 우군 부대가 존재할 경우, 각 우군의 무력/지력 및 친밀도 수준에
     * 비례하여 자동으로 협동 전법이 동시 발동되어 합산되는 체인 대미지.
     *
     * 공식:
     * ChainBonus = Σ (BaseAttack × 0.4 × RelationshipMultiplier)
     *
     * RelationshipMultiplier:
     * - 의형제(SWORN_BROTHER): 1.5
     * - 배우자(SPOUSE): 1.3
     * - 상생(FRIEND): 1.1
     * - 기타 관계: 1.0 (체인 불발동)
     *
     * 친밀도 가중치: affinity / 100 을 곱하여 반영
     *
     * @param attackerOfficerId - 공격자 무장 ID
     * @param targetHex - 공격 대상 적 유닛 위치
     * @param allyUnits - 전장의 모든 아군 부대 (officerId, unit, position)
     */
    triggerCooperativeChain(attackerOfficerId: OfficerID, attackerUnit: BattleUnit, targetHex: HexCoord, allyUnits: {
        officerId: OfficerID;
        unit: BattleUnit;
        position: HexCoord;
    }[], officerLookup: (id: OfficerID) => Officer | null): {
        chainBonus: number;
        participants: ChainParticipant[];
        details: string[];
    };
    resolveAttack(attacker: AttackerInfo, defender: DefenderInfo, allyUnits: {
        officerId: OfficerID;
        unit: BattleUnit;
        position: HexCoord;
    }[], officerLookup: (id: OfficerID) => Officer | null): {
        damage: DamageResult;
        chain: {
            chainBonus: number;
            participants: ChainParticipant[];
            details: string[];
        };
    };
    /**
     * 아군 유닛에서 수도/보급거점까지의 경로가 적군에 의해 차단되지 않았는지 BFS 탐색.
     * 적 유닛이 위치한 헥스는 통과 불가.
     */
    isSupplyLineCut(unitPos: HexCoord, capitalPos: HexCoord, enemyPositions: HexCoord[]): boolean;
    /**
     * 현재 전장의 모든 적 유닛 주변 6방향 헥스를 ZOC 영역으로 마킹.
     * 반환된 Set에 포함된 헥스로 진입 시 이동 강제 정지.
     */
    generateZOCMap(enemyPositions: HexCoord[]): Set<string>;
    /**
     * 각 병종별 지형 이동 비용:
     * - INFANTRY: PLAINS 1, FOREST 1.5, MOUNTAIN 2, RIVER 3
     * - CAVALRY: PLAINS 0.5, FOREST 2, MOUNTAIN 3, RIVER 4
     * - ARCHER: PLAINS 1, FOREST 1.5, MOUNTAIN 2.5, RIVER 3
     * - SIEGE: PLAINS 2, FOREST 3, MOUNTAIN 4, RIVER 5
     */
    calculateMovementCost(fromHex: HexCoord, toHex: HexCoord, unitType: UnitType, zocMap: Set<string>): number;
}
//# sourceMappingURL=battle_calculations.d.ts.map