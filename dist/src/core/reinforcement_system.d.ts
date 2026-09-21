/**
 * 증원 시스템 [86/107] — 인접 아군 도시 지원군
 *
 * 공성전이 벌어지는 방어 도시에 대해 인접(직선거리 기준) 아군 도시가
 * 병력·무장을 지원하는 시스템. 플레이어 출진과 AI 공성 양쪽에서 사용한다.
 *
 * 도시 간 인접 판정은 전도 좌표(mapX/mapY) 유클리드 거리로 하며,
 * CITY_MAP_COORDS에 없는 도시(커스텀 모드 등)는 배제한다.
 */
import type { City, Officer, Army } from './types.js';
/** 두 도시가 인접한지 (거리 기반) */
export declare function areCitiesAdjacent(cityAId: string, cityBId: string): boolean;
/** 방어 도시에 증원 가능한 인접 아군 도시 목록 */
export declare function getAdjacentFriendlyCities(defenseCityId: string, ownerId: string, cities: City[]): City[];
export interface ReinforcementContingent {
    sourceCityId: string;
    troops: number;
    officerIds: string[];
}
export interface ReinforcementResult {
    defenseCityId: string;
    totalTroops: number;
    contingents: ReinforcementContingent[];
    officerIds: string[];
}
/**
 * 인접 아군 도시들로부터 지원군을 편성한다.
 *
 * 파견 규칙:
 *  - 각 아군 도시는 보유 병력의 50%를 지원 (최소 200 필요)
 *  - 무장은 최대 2명 파견, 도시에 최소 1명은 남긴다
 *  - 파견 무장은 통솔 높은 순으로 선발
 */
export declare function assembleReinforcements(defenseCityId: string, ownerId: string, cities: City[], officers: Officer[], armies?: Army[]): ReinforcementResult;
/** 도시가 다른 도시와 맞닿아 있는지 (공격 측에서 출진 가능 대상 판정용) */
export declare function canAttackFrom(fromCityId: string, toCityId: string): boolean;
//# sourceMappingURL=reinforcement_system.d.ts.map