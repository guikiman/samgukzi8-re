/**
 * 월간 보고서 [E1-361 연계] — 월말 정산 후 수입/지출/AI 행동 요약
 * + 포팅 시스템 월간 동향 섹션 [76-85][321-340][341-360][421-438]
 */
import type { GameStore } from './game_store.js';
export interface MonthlyReport {
    year: number;
    month: number;
    turnCount: number;
    /** 플레이어 세력 재정 */
    playerGold: number;
    playerFood: number;
    goldIncome: number;
    foodIncome: number;
    /** 도시별 요약 */
    cities: Array<{
        name: string;
        funds: number;
        development: number;
        commerce: number;
        farming: number;
    }>;
    /** AI 세력 요약 */
    factions: Array<{
        name: string;
        gold: number;
        cities: number;
        officers: number;
    }>;
    /** 포팅 시스템 월간 동향 — 엔진의 processPortedSystemsMonthly가 수집 [76-85][321-340][341-360][421-438] */
    ported?: PortedMonthlySection | null;
}
export interface PortedMonthlySection {
    /** 이번 달 완료된 출진 명령 [77] */
    campaigns: Array<{
        targetCity: string;
        leaderName: string;
        soldiers: number;
    }>;
    /** 이번 달 완료된 수송 명령 [78] */
    transports: Array<{
        fromCity: string;
        toCity: string;
        gold: number;
        food: number;
        soldiers: number;
    }>;
    /** 붕괴한 첩보망 — 유지비 미납 [346] */
    collapsedNetworks: Array<{
        factionId: string;
        cityId: string;
    }>;
    /** 지역 기후 현황 [321-340] */
    climates: Array<{
        regionId: string;
        weather: string;
        temperature: number;
        harvestModifier: number;
    }>;
    /** 이번 달 은퇴한 무장 [434] */
    retired: Array<{
        officerName: string;
        age: number;
    }>;
}
export declare class MonthlyReportSystem {
    private store;
    /** 엔진이 수집한 최근 월간 포팅 시스템 요약 peek (없으면 섹션 생략) */
    private portedProvider?;
    constructor(store: GameStore, 
    /** 엔진이 수집한 최근 월간 포팅 시스템 요약 peek (없으면 섹션 생략) */
    portedProvider?: (() => PortedMonthlySection | null) | undefined);
    generate(): MonthlyReport;
}
//# sourceMappingURL=monthly_report.d.ts.map