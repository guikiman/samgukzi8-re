/**
 * [B18] 원군 참전 시차 로직 — Reinforcement System
 *
 * ReinforcementManager:
 *   - requestReinforcement(): 인접 도시에 원군 요청
 *   - calculateArrivalTurn(): 도착 턴 계산 (거리×2 + 날씨패널티)
 *   - processReinforcementArrival(): 매 턴 호출, 도착 시 전장 투입
 */
const WEATHER_SPEED_FACTOR = {
    SUNNY: 1.0, CLOUDY: 0.9, RAIN: 0.7, SNOW: 0.5, STORM: 0.3, FOG: 0.5,
};
export class ReinforcementManager {
    constructor() {
        this.requests = new Map();
        this.currentTurn = 0;
    }
    setCurrentTurn(turn) {
        this.currentTurn = turn;
    }
    /** 원군 요청 */
    requestReinforcement(sourceCityId, targetBattleId, officerIds, soldierCount, distance, weather = 'SUNNY') {
        const requestId = `reinforce_${sourceCityId}_${targetBattleId}_${Date.now()}`;
        const arrivalTurn = this.calculateArrivalTurn(distance, weather);
        const request = {
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
    calculateArrivalTurn(distance, weather = 'SUNNY') {
        const baseTurns = Math.max(1, distance * 2);
        const weatherFactor = WEATHER_SPEED_FACTOR[weather];
        return Math.max(1, Math.ceil(baseTurns / weatherFactor));
    }
    /** 매 턴 호출: 도착한 원군 처리 */
    processReinforcementArrival() {
        const arrived = [];
        for (const [id, request] of this.requests) {
            if (request.status === 'MARCHING' || request.status === 'REQUESTED') {
                if (this.currentTurn >= request.estimatedArrivalTurn) {
                    const updated = { ...request, status: 'ARRIVED' };
                    this.requests.set(id, updated);
                    arrived.push(updated);
                }
                else if (request.status === 'REQUESTED') {
                    this.requests.set(id, { ...request, status: 'MARCHING' });
                }
            }
        }
        return arrived;
    }
    /** 대기 중인 원군 조회 */
    getPendingReinforcements(battleId) {
        return Array.from(this.requests.values()).filter(r => r.targetBattleId === battleId && (r.status === 'REQUESTED' || r.status === 'MARCHING'));
    }
    /** 도착한 원군 조회 */
    getArrivedReinforcements(battleId) {
        return Array.from(this.requests.values()).filter(r => r.targetBattleId === battleId && r.status === 'ARRIVED');
    }
    /** 원군 취소 */
    cancelReinforcement(requestId) {
        const request = this.requests.get(requestId);
        if (!request || request.status === 'ARRIVED')
            return false;
        this.requests.set(requestId, { ...request, status: 'CANCELLED' });
        return true;
    }
    getRequest(requestId) {
        return this.requests.get(requestId);
    }
    getAllRequests() {
        return Array.from(this.requests.values());
    }
    clear() {
        this.requests.clear();
    }
}
//# sourceMappingURL=reinforcement_system.js.map