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

const WEATHER_SPEED_FACTOR: Record<WeatherSpeed, number> = {
    SUNNY: 1.0, CLOUDY: 0.9, RAIN: 0.7, SNOW: 0.5, STORM: 0.3, FOG: 0.5,
};

export class ReinforcementManager {
    private requests: Map<string, ReinforcementRequest> = new Map();
    private currentTurn: number = 0;

    setCurrentTurn(turn: number): void {
        this.currentTurn = turn;
    }

    /** 원군 요청 */
    requestReinforcement(
        sourceCityId: CityID,
        targetBattleId: string,
        officerIds: OfficerID[],
        soldierCount: number,
        distance: number,
        weather: WeatherSpeed = 'SUNNY',
    ): ReinforcementRequest {
        const requestId = `reinforce_${sourceCityId}_${targetBattleId}_${Date.now()}`;
        const arrivalTurn = this.calculateArrivalTurn(distance, weather);

        const request: ReinforcementRequest = {
            requestId,
            sourceCityId,
            targetBattleId,
            officerIds,
            soldierCount: Math.max(1, Math.min(soldierCount, 10000)),
            departureTurn: this.currentTurn,
            estimatedArrivalTurn: this.currentTurn + arrivalTurn,
            status: 'REQUESTED',
        };

        this.requests.set(requestId, request);
        return request;
    }

    /** 도착 턴 계산 */
    calculateArrivalTurn(distance: number, weather: WeatherSpeed = 'SUNNY'): number {
        const baseTurns = Math.max(1, distance * 2);
        const weatherFactor = WEATHER_SPEED_FACTOR[weather];
        return Math.max(1, Math.ceil(baseTurns / weatherFactor));
    }

    /** 매 턴 호출: 도착한 원군 처리 */
    processReinforcementArrival(): ReinforcementRequest[] {
        const arrived: ReinforcementRequest[] = [];

        for (const [id, request] of this.requests) {
            if (request.status === 'MARCHING' || request.status === 'REQUESTED') {
                if (this.currentTurn >= request.estimatedArrivalTurn) {
                    const updated: ReinforcementRequest = { ...request, status: 'ARRIVED' };
                    this.requests.set(id, updated);
                    arrived.push(updated);
                } else if (request.status === 'REQUESTED') {
                    this.requests.set(id, { ...request, status: 'MARCHING' });
                }
            }
        }

        return arrived;
    }

    /** 대기 중인 원군 조회 */
    getPendingReinforcements(battleId: string): ReinforcementRequest[] {
        return Array.from(this.requests.values()).filter(
            r => r.targetBattleId === battleId && (r.status === 'REQUESTED' || r.status === 'MARCHING'),
        );
    }

    /** 도착한 원군 조회 */
    getArrivedReinforcements(battleId: string): ReinforcementRequest[] {
        return Array.from(this.requests.values()).filter(
            r => r.targetBattleId === battleId && r.status === 'ARRIVED',
        );
    }

    /** 원군 취소 */
    cancelReinforcement(requestId: string): boolean {
        const request = this.requests.get(requestId);
        if (!request || request.status === 'ARRIVED') return false;
        this.requests.set(requestId, { ...request, status: 'CANCELLED' });
        return true;
    }

    getRequest(requestId: string): ReinforcementRequest | undefined {
        return this.requests.get(requestId);
    }

    getAllRequests(): ReinforcementRequest[] {
        return Array.from(this.requests.values());
    }

    clear(): void {
        this.requests.clear();
    }
}
