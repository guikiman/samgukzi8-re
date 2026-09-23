/**
 * [Phase 7] 평정 및 군단 시스템 — Strategic Command & Army Manager
 * 파일: src/core/strategic_command_system.ts
 *
 * 설계 스펙:
 * - [76-79] 평정, 출진 명령, 수송, 군단 편제
 * - [80-82] 위임 방침, 영지 변경, 명령 거부
 * - [83-85] 방랑군 해산, 방해/요격, 병종 편제
 *
 * Python 원본: src/systems/strategic_manager.py
 * FSM 오케스트레이터(game_engine.ts)와 커맨드 패턴(command_system.ts)과 연동됨
 */
// ============================================================
// 1. 열거형 및 데이터 모델
// ============================================================
export var StrategicPolicy;
(function (StrategicPolicy) {
    StrategicPolicy["CONQUEST"] = "conquest";
    StrategicPolicy["DOMINATION"] = "domination";
    StrategicPolicy["DEFENSE"] = "defense";
    StrategicPolicy["SUPPLY_PRIO"] = "supply_prio";
})(StrategicPolicy || (StrategicPolicy = {}));
// ============================================================
// 2. 전략 커맨드 매니저 (클래스)
// ============================================================
export class StrategicCommandManager {
    constructor(factionId, strategyPoints = 100) {
        this.delegationPolicies = new Map();
        this.activeCampaigns = [];
        this.transportOrders = [];
        this.turnCount = 0;
        this.factionId = factionId;
        this.strategyPoints = strategyPoints;
    }
    getFactionId() { return this.factionId; }
    getStrategyPoints() { return this.strategyPoints; }
    getDelegationPolicy(viceroyId) {
        return this.delegationPolicies.get(viceroyId) ?? null;
    }
    getActiveCampaigns() { return this.activeCampaigns; }
    getTransportOrders() { return this.transportOrders; }
    /**
     * 전략 포인트 소비 — [76] 평정 명령 리소스 관리
     * O(1)
     */
    consumePoints(amount) {
        if (this.strategyPoints >= amount) {
            this.strategyPoints -= amount;
            return true;
        }
        return false;
    }
    /**
     * 출진 명령 — [77] 군단 편제 후 목표 도시로 진격
     * @returns 명령 성립 여부 (전략 포인트 부족 시 false)
     */
    orderCampaign(army, targetCity, turnCount) {
        if (army.soldiers <= 0)
            return false;
        if (!this.consumePoints(StrategicCommandManager.CAMPAIGN_COST))
            return false;
        this.activeCampaigns.push({
            army,
            targetCity,
            turnIssued: turnCount ?? this.turnCount,
        });
        return true;
    }
    /**
     * 수송 명령 — [78] 도시 간 금/군량/병력 이동
     */
    orderTransport(fromCity, toCity, gold, food, soldiers, turnCount) {
        if (gold < 0 || food < 0 || soldiers < 0)
            return false;
        if (!this.consumePoints(StrategicCommandManager.TRANSPORT_COST))
            return false;
        this.transportOrders.push({
            fromCity,
            toCity,
            gold,
            food,
            soldiers,
            turnIssued: turnCount ?? this.turnCount,
        });
        return true;
    }
    /**
     * 위임 방침 설정 — [80] 태수/군단장별 자율 방침 지정
     */
    setDelegationPolicy(viceroyId, policy, bridge) {
        this.delegationPolicies.set(viceroyId, policy);
        bridge?.setFactionPolicy(this.factionId, viceroyId, policy);
    }
    /**
     * 캠페인 취소 — [82] 명령 거부/철회 (포인트 환불 없음)
     */
    cancelCampaign(targetCity, leaderId) {
        const idx = this.activeCampaigns.findIndex((c) => c.targetCity === targetCity && c.army.leaderId === leaderId);
        if (idx === -1)
            return false;
        this.activeCampaigns.splice(idx, 1);
        return true;
    }
    /**
     * 도시 습격 명령 — [83] 플레이어 방랑군 재기 커맨드 (전략 포인트 30 소비)
     * 판정 자체는 vagrant_monthly_actions.resolvePlayerRaid가 수행하며,
     * 여기서는 전략 포인트 가용 여부만 확인한다.
     */
    orderRaid() {
        return this.consumePoints(StrategicCommandManager.RAID_COST);
    }
    /** [83] 방랑군 해산 — 군단 전체 해체 */
    disbandVagrantArmy() {
        this.activeCampaigns = [];
        this.transportOrders = [];
    }
    /** [85] 병종 편제 보정 — 진형에 따른 전투 보정값 조회 */
    getFormationBonus(formation) {
        const table = {
            basic: { attack: 1.0, defense: 1.0, speed: 1.0 },
            wedge: { attack: 1.15, defense: 0.9, speed: 1.1 }, // 쐐기
            square: { attack: 0.85, defense: 1.2, speed: 0.8 }, // 방진
            wing: { attack: 1.05, defense: 0.95, speed: 1.25 }, // 학익
            siege: { attack: 1.3, defense: 0.7, speed: 0.6 }, // 공성
        };
        return table[formation];
    }
    /**
     * 턴 처리 — 전략 포인트 회복 및 명령 큐 진행
     */
    processTurn(turnCount) {
        if (turnCount !== undefined)
            this.turnCount = turnCount;
        this.turnCount++;
        // 포인트 회복
        this.strategyPoints = Math.min(StrategicCommandManager.MAX_STRATEGY_POINTS, this.strategyPoints + StrategicCommandManager.POINTS_REGEN_PER_TURN);
        // 진행 중 명령은 상위 엔진(전투/수송 시스템)에서 완료 처리 후 반환
        const campaignsCompleted = this.activeCampaigns;
        const transportsCompleted = this.transportOrders;
        this.activeCampaigns = [];
        this.transportOrders = [];
        return { campaignsCompleted, transportsCompleted };
    }
    // ============================================================
    // 세이브/로드 직렬화 [17]
    // ============================================================
    serialize() {
        return {
            factionId: this.factionId,
            strategyPoints: this.strategyPoints,
            delegationPolicies: [...this.delegationPolicies.entries()],
            turnCount: this.turnCount,
        };
    }
    restore(data) {
        this.delegationPolicies = new Map(data.delegationPolicies);
        this.setStrategyPoints(data.strategyPoints);
        this.setTurnCount(data.turnCount);
    }
    /** 진행 중 명령 복원 — 세이브 로드 시 출진/수송 큐 복구 (구버전 호환) */
    restoreCampaigns(campaigns, transports) {
        this.activeCampaigns = campaigns;
        this.transportOrders = transports;
    }
    setStrategyPoints(value) {
        this.strategyPoints = value;
    }
    setTurnCount(value) {
        this.turnCount = value;
    }
}
StrategicCommandManager.MAX_STRATEGY_POINTS = 100;
StrategicCommandManager.POINTS_REGEN_PER_TURN = 20;
StrategicCommandManager.CAMPAIGN_COST = 20;
StrategicCommandManager.TRANSPORT_COST = 10;
/** 도시 습격 커맨드 비용 [83] */
StrategicCommandManager.RAID_COST = 30;
//# sourceMappingURL=strategic_command_system.js.map