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
export declare enum StrategicPolicy {
    CONQUEST = "conquest",// 정복 — 적 세력 공격 우선
    DOMINATION = "domination",// 패권 — 내정/병력 우선
    DEFENSE = "defense",// 방어 — 성벽/훈련 우선
    SUPPLY_PRIO = "supply_prio"
}
export type FormationType = 'basic' | 'wedge' | 'square' | 'wing' | 'siege';
export interface ArmyUnit {
    leaderId: OfficerID;
    officerIds: OfficerID[];
    soldiers: number;
    training: number;
    morale: number;
    formation: FormationType;
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
export declare class StrategicCommandManager {
    private readonly factionId;
    private strategyPoints;
    private static readonly MAX_STRATEGY_POINTS;
    private static readonly POINTS_REGEN_PER_TURN;
    private static readonly CAMPAIGN_COST;
    private static readonly TRANSPORT_COST;
    /** 도시 습격 커맨드 비용 [83] */
    private static readonly RAID_COST;
    private delegationPolicies;
    private activeCampaigns;
    private transportOrders;
    private turnCount;
    constructor(factionId: FactionID, strategyPoints?: number);
    getFactionId(): FactionID;
    getStrategyPoints(): number;
    getDelegationPolicy(viceroyId: OfficerID): StrategicPolicy | null;
    getActiveCampaigns(): readonly CampaignOrder[];
    getTransportOrders(): readonly TransportOrder[];
    /**
     * 전략 포인트 소비 — [76] 평정 명령 리소스 관리
     * O(1)
     */
    consumePoints(amount: number): boolean;
    /**
     * 출진 명령 — [77] 군단 편제 후 목표 도시로 진격
     * @returns 명령 성립 여부 (전략 포인트 부족 시 false)
     */
    orderCampaign(army: ArmyUnit, targetCity: CityID, turnCount?: number): boolean;
    /**
     * 수송 명령 — [78] 도시 간 금/군량/병력 이동
     */
    orderTransport(fromCity: CityID, toCity: CityID, gold: number, food: number, soldiers: number, turnCount?: number): boolean;
    /**
     * 위임 방침 설정 — [80] 태수/군단장별 자율 방침 지정
     */
    setDelegationPolicy(viceroyId: OfficerID, policy: StrategicPolicy, bridge?: IPolicyBridge): void;
    /**
     * 캠페인 취소 — [82] 명령 거부/철회 (포인트 환불 없음)
     */
    cancelCampaign(targetCity: CityID, leaderId: OfficerID): boolean;
    /**
     * 도시 습격 명령 — [83] 플레이어 방랑군 재기 커맨드 (전략 포인트 30 소비)
     * 판정 자체는 vagrant_monthly_actions.resolvePlayerRaid가 수행하며,
     * 여기서는 전략 포인트 가용 여부만 확인한다.
     */
    orderRaid(): boolean;
    /** [83] 방랑군 해산 — 군단 전체 해체 */
    disbandVagrantArmy(): void;
    /** [85] 병종 편제 보정 — 진형에 따른 전투 보정값 조회 */
    getFormationBonus(formation: FormationType): {
        attack: number;
        defense: number;
        speed: number;
    };
    /**
     * 턴 처리 — 전략 포인트 회복 및 명령 큐 진행
     */
    processTurn(turnCount?: number): {
        campaignsCompleted: CampaignOrder[];
        transportsCompleted: TransportOrder[];
    };
    serialize(): {
        factionId: FactionID;
        strategyPoints: number;
        delegationPolicies: Array<[OfficerID, StrategicPolicy]>;
        turnCount: number;
    };
    restore(data: {
        factionId: FactionID;
        strategyPoints: number;
        delegationPolicies: Array<[OfficerID, StrategicPolicy]>;
        turnCount: number;
    }): void;
    /** 진행 중 명령 복원 — 세이브 로드 시 출진/수송 큐 복구 (구버전 호환) */
    restoreCampaigns(campaigns: CampaignOrder[], transports: TransportOrder[]): void;
    private setStrategyPoints;
    private setTurnCount;
}
//# sourceMappingURL=strategic_command_system.d.ts.map