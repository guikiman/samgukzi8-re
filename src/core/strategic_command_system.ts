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

import type { OfficerID, FactionID, CityID } from './types.js';

// ============================================================
// 1. 열거형 및 데이터 모델
// ============================================================

export enum StrategicPolicy {
    CONQUEST = 'conquest',         // 정복 — 적 세력 공격 우선
    DOMINATION = 'domination',     // 패권 — 내정/병력 우선
    DEFENSE = 'defense',           // 방어 — 성벽/훈련 우선
    SUPPLY_PRIO = 'supply_prio',   // 보급 우선 — 군량/수송 우선
}

export type FormationType = 'basic' | 'wedge' | 'square' | 'wing' | 'siege';

export interface ArmyUnit {
    leaderId: OfficerID;           // 군단장
    officerIds: OfficerID[];       // 참전 무장 목록
    soldiers: number;              // 병력
    training: number;              // 훈련도 (0~100)
    morale: number;                // 사기 (0~100)
    formation: FormationType;      // 진형
}

export interface TransportOrder {
    readonly fromCity: CityID;
    readonly toCity: CityID;
    readonly gold: number;
    readonly food: number;
    readonly soldiers: number;
    readonly turnIssued: number;
}

export interface CampaignOrder {
    readonly army: ArmyUnit;
    readonly targetCity: CityID;
    readonly turnIssued: number;
}

/** 외교 매니저가 구현해야 하는 최소 인터페이스 (느슨한 결합) */
export interface IPolicyBridge {
    setFactionPolicy(factionId: FactionID, viceroyId: OfficerID, policy: string): void;
}

// ============================================================
// 2. 전략 커맨드 매니저 (클래스)
// ============================================================

export class StrategicCommandManager {
    private readonly factionId: FactionID;
    private strategyPoints: number;
    private static readonly MAX_STRATEGY_POINTS = 100;
    private static readonly POINTS_REGEN_PER_TURN = 20;
    private static readonly CAMPAIGN_COST = 20;
    private static readonly TRANSPORT_COST = 10;
    /** 도시 습격 커맨드 비용 [83] */
    private static readonly RAID_COST = 30;

    private delegationPolicies: Map<OfficerID, StrategicPolicy> = new Map();
    private activeCampaigns: CampaignOrder[] = [];
    private transportOrders: TransportOrder[] = [];
    private turnCount = 0;

    constructor(factionId: FactionID, strategyPoints = 100) {
        this.factionId = factionId;
        this.strategyPoints = strategyPoints;
    }

    getFactionId(): FactionID { return this.factionId; }
    getStrategyPoints(): number { return this.strategyPoints; }
    getDelegationPolicy(viceroyId: OfficerID): StrategicPolicy | null {
        return this.delegationPolicies.get(viceroyId) ?? null;
    }
    getActiveCampaigns(): readonly CampaignOrder[] { return this.activeCampaigns; }
    getTransportOrders(): readonly TransportOrder[] { return this.transportOrders; }

    /**
     * 전략 포인트 소비 — [76] 평정 명령 리소스 관리
     * O(1)
     */
    consumePoints(amount: number): boolean {
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
    orderCampaign(army: ArmyUnit, targetCity: CityID, turnCount?: number): boolean {
        if (army.soldiers <= 0) return false;
        if (!this.consumePoints(StrategicCommandManager.CAMPAIGN_COST)) return false;

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
    orderTransport(
        fromCity: CityID,
        toCity: CityID,
        gold: number,
        food: number,
        soldiers: number,
        turnCount?: number,
    ): boolean {
        if (gold < 0 || food < 0 || soldiers < 0) return false;
        if (!this.consumePoints(StrategicCommandManager.TRANSPORT_COST)) return false;

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
    setDelegationPolicy(viceroyId: OfficerID, policy: StrategicPolicy, bridge?: IPolicyBridge): void {
        this.delegationPolicies.set(viceroyId, policy);
        bridge?.setFactionPolicy(this.factionId, viceroyId, policy);
    }

    /**
     * 캠페인 취소 — [82] 명령 거부/철회 (포인트 환불 없음)
     */
    cancelCampaign(targetCity: CityID, leaderId: OfficerID): boolean {
        const idx = this.activeCampaigns.findIndex(
            (c) => c.targetCity === targetCity && c.army.leaderId === leaderId,
        );
        if (idx === -1) return false;
        this.activeCampaigns.splice(idx, 1);
        return true;
    }

    /**
     * 도시 습격 명령 — [83] 플레이어 방랑군 재기 커맨드 (전략 포인트 30 소비)
     * 판정 자체는 vagrant_monthly_actions.resolvePlayerRaid가 수행하며,
     * 여기서는 전략 포인트 가용 여부만 확인한다.
     */
    orderRaid(): boolean {
        return this.consumePoints(StrategicCommandManager.RAID_COST);
    }

    /** [83] 방랑군 해산 — 군단 전체 해체 */
    disbandVagrantArmy(): void {
        this.activeCampaigns = [];
        this.transportOrders = [];
    }

    /** [85] 병종 편제 보정 — 진형에 따른 전투 보정값 조회 */
    getFormationBonus(formation: FormationType): { attack: number; defense: number; speed: number } {
        const table: Record<FormationType, { attack: number; defense: number; speed: number }> = {
            basic:  { attack: 1.0,  defense: 1.0,  speed: 1.0 },
            wedge:  { attack: 1.15, defense: 0.9,  speed: 1.1 },  // 쐐기
            square: { attack: 0.85, defense: 1.2,  speed: 0.8 },  // 방진
            wing:   { attack: 1.05, defense: 0.95, speed: 1.25 }, // 학익
            siege:  { attack: 1.3,  defense: 0.7,  speed: 0.6 },  // 공성
        };
        return table[formation];
    }

    /**
     * 턴 처리 — 전략 포인트 회복 및 명령 큐 진행
     */
    processTurn(turnCount?: number): { campaignsCompleted: CampaignOrder[]; transportsCompleted: TransportOrder[] } {
        if (turnCount !== undefined) this.turnCount = turnCount;
        this.turnCount++;

        // 포인트 회복
        this.strategyPoints = Math.min(
            StrategicCommandManager.MAX_STRATEGY_POINTS,
            this.strategyPoints + StrategicCommandManager.POINTS_REGEN_PER_TURN,
        );

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

    serialize(): {
        factionId: FactionID;
        strategyPoints: number;
        delegationPolicies: Array<[OfficerID, StrategicPolicy]>;
        turnCount: number;
    } {
        return {
            factionId: this.factionId,
            strategyPoints: this.strategyPoints,
            delegationPolicies: [...this.delegationPolicies.entries()],
            turnCount: this.turnCount,
        };
    }

    restore(data: {
        factionId: FactionID;
        strategyPoints: number;
        delegationPolicies: Array<[OfficerID, StrategicPolicy]>;
        turnCount: number;
    }): void {
        this.delegationPolicies = new Map(data.delegationPolicies);
        this.setStrategyPoints(data.strategyPoints);
        this.setTurnCount(data.turnCount);
    }

    /** 진행 중 명령 복원 — 세이브 로드 시 출진/수송 큐 복구 (구버전 호환) */
    restoreCampaigns(campaigns: CampaignOrder[], transports: TransportOrder[]): void {
        (this as unknown as { activeCampaigns: CampaignOrder[] }).activeCampaigns = campaigns;
        (this as unknown as { transportOrders: TransportOrder[] }).transportOrders = transports;
    }

    private setStrategyPoints(value: number): void {
        (this as unknown as { strategyPoints: number }).strategyPoints = value;
    }

    private setTurnCount(value: number): void {
        (this as unknown as { turnCount: number }).turnCount = value;
    }
}
