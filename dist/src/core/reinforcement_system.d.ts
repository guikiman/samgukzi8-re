/**
 * [B18] 원군 참전 시차 로직 — Reinforcement System
 *
 * ReinforcementManager:
 *   - requestReinforcement(): 인접 도시에 원군 요청
 *   - calculateArrivalTurn(): 도착 턴 계산 (거리×2 + 날씨패널티)
 *   - processReinforcementArrival(): 매 턴 호출, 도착 시 전장 투입
 */
import type { OfficerID, CityID } from './types';
export type ReinforcementStatus = 'REQUESTED' | 'MARCHING' | 'ARRIVED' | 'CANCELLED';
export type WeatherSpeed = 'SUNNY' | 'CLOUDY' | 'RAIN' | 'SNOW' | 'STORM' | 'FOG';
export interface ReinforcementRequest {
    readonly requestId: string;
    readonly sourceCityId: CityID;
    readonly targetBattleId: string;
    readonly officerIds: OfficerID[];
    readonly soldierCount: number;
    readonly departureTurn: number;
    readonly estimatedArrivalTurn: number;
    readonly status: ReinforcementStatus;
}
export declare class ReinforcementManager {
    private requests;
    private currentTurn;
    setCurrentTurn(turn: number): void;
    /** 원군 요청 */
    requestReinforcement(sourceCityId: CityID, targetBattleId: string, officerIds: OfficerID[], soldierCount: number, distance: number, weather?: WeatherSpeed): ReinforcementRequest;
    /** 도착 턴 계산 */
    calculateArrivalTurn(distance: number, weather?: WeatherSpeed): number;
    /** 매 턴 호출: 도착한 원군 처리 */
    processReinforcementArrival(): ReinforcementRequest[];
    /** 대기 중인 원군 조회 */
    getPendingReinforcements(battleId: string): ReinforcementRequest[];
    /** 도착한 원군 조회 */
    getArrivedReinforcements(battleId: string): ReinforcementRequest[];
    /** 원군 취소 */
    cancelReinforcement(requestId: string): boolean;
    getRequest(requestId: string): ReinforcementRequest | undefined;
    getAllRequests(): ReinforcementRequest[];
    clear(): void;
}
//# sourceMappingURL=reinforcement_system.d.ts.map