/**
 * [A8] 방랑군 결성 및 거병 시스템 — Wanderer Army System
 *
 * WandererArmyManager:
 *   - formWandererArmy(): 무소속 무장이 방랑군 결성
 *   - disband(): 방랑군 해산
 *   - moveTo(): 도시로 이동
 *   - uprise(): 거병 (도시 장악 시도)
 *   - 거병 성공 확률 = (병사수/도시방어군) × (통솔/100) × (1 - 충성도/100)
 */
import type { OfficerID, CityID, FactionID } from './types';
export interface WandererArmyState {
    readonly wandererId: string;
    readonly leaderId: OfficerID;
    readonly officerIds: OfficerID[];
    readonly gold: number;
    readonly food: number;
    readonly soldiers: number;
    readonly baseCamp: string | null;
    readonly location: CityID | null;
    readonly formationDate: number;
    readonly morale: number;
    readonly isActive: boolean;
}
export interface UpriseResult {
    readonly success: boolean;
    readonly capturedCityId: CityID | null;
    readonly newFactionId: FactionID | null;
    readonly survivors: number;
    readonly message: string;
}
export declare class WandererArmyManager {
    private state;
    /**
     * 방랑군 결성
     * @param leaderId - 지휘관 무장 ID
     * @param gold - 보유 금
     * @param soldiers - 모집 병사 수
     */
    formWandererArmy(leaderId: OfficerID, gold: number, soldiers: number): WandererArmyState;
    /** 방랑군 해산 */
    disband(): boolean;
    /** 도시로 이동 */
    moveTo(cityId: CityID): boolean;
    /** 방랑군에 무장 추가 */
    addOfficer(officerId: OfficerID): boolean;
    /**
     * 거병 (도시 장악 시도)
     * @param targetCityId - 공격 대상 도시
     * @param cityDefenseForce - 도시 방어군 수
     * @param cityLoyalty - 도시 충성도 (0~100)
     * @param leaderLeadership - 지휘관 통솔력 (0~100)
     */
    uprise(targetCityId: CityID, cityDefenseForce: number, cityLoyalty: number, leaderLeadership: number): UpriseResult;
    getState(): WandererArmyState | null;
    /** 방랑군 상태 초기화 (테스트용) */
    reset(): void;
}
//# sourceMappingURL=wanderer_army_system.d.ts.map