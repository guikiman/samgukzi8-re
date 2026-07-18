/**
 * [13] 연간 보고서(Annual Report) 데이터 수집 엔진 — AnnualReportEngine
 *
 * AnnualReportEngine:
 *   1. 매년 4분기 종료 시 세력의 영토 변화 집계
 *   2. 경제 성장률 (금/식량 증감률) 계산
 *   3. 무장 이탈률 및 충성도 변동 요약
 *   4. 리포트를 구조화된 객체로 패킹
 *   5. ChronicleLogGenerator와 연동하여 로그 기록
 */
import type { Faction, FactionID } from './types.js';
import { ChronicleLogGenerator } from './chronicle_log_generator.js';
export interface FactionAnnualReport {
    readonly factionId: FactionID;
    readonly factionName: string;
    readonly year: number;
    readonly territory: TerritoryDelta;
    readonly economy: EconomyDelta;
    readonly military: MilitaryDelta;
    readonly personnel: PersonnelDelta;
    readonly summary: string;
}
export interface TerritoryDelta {
    readonly previousCityCount: number;
    readonly currentCityCount: number;
    readonly citiesGained: number;
    readonly citiesLost: number;
    readonly netChange: number;
}
export interface EconomyDelta {
    readonly previousGold: number;
    readonly currentGold: number;
    readonly goldGrowthRate: number;
    readonly previousFood: number;
    readonly currentFood: number;
    readonly foodGrowthRate: number;
    readonly totalRevenue: number;
    readonly totalExpenses: number;
}
export interface MilitaryDelta {
    readonly previousSoldiers: number;
    readonly currentSoldiers: number;
    readonly soldiersGained: number;
    readonly soldiersLost: number;
    readonly previousArmies: number;
    readonly currentArmies: number;
}
export interface PersonnelDelta {
    readonly previousOfficerCount: number;
    readonly currentOfficerCount: number;
    readonly officersGained: number;
    readonly officersLost: number;
    readonly averageLoyalty: number;
    readonly defectors: number;
}
export interface AnnualReport {
    readonly year: number;
    readonly factionReports: FactionAnnualReport[];
    readonly globalSummary: GlobalSummary;
    readonly timestamp: number;
}
export interface GlobalSummary {
    readonly totalFactions: number;
    readonly totalCities: number;
    readonly totalOfficers: number;
    readonly totalSoldiers: number;
    readonly mostPowerfulFaction: string;
    readonly fastestGrowingFaction: string;
    readonly warsActive: number;
    readonly alliancesActive: number;
}
export declare class AnnualReportEngine {
    private reports;
    private previousSnapshot;
    private logGenerator;
    constructor(logGenerator?: ChronicleLogGenerator);
    /**
     * 연간 보고서를 생성한다.
     * @param factions 현재 세력 목록
     * @param year 보고서 년도
     * @returns 생성된 연간 보고서
     */
    generateReport(factions: Faction[], year: number): AnnualReport;
    /**
     * 단일 세력의 연간 보고서를 생성한다.
     */
    private buildFactionReport;
    /**
     * 글로벌 요약 정보를 생성한다.
     */
    private buildGlobalSummary;
    /**
     * 현재 세력 스냅샷을 저장한다.
     */
    private saveSnapshot;
    /**
     * 모든 보고서 이력을 반환한다.
     */
    getReportHistory(): AnnualReport[];
    /**
     * 특정 년도의 보고서를 반환한다.
     */
    getReportByYear(year: number): AnnualReport | undefined;
    /**
     * 엔진 상태를 초기화한다.
     */
    clear(): void;
}
//# sourceMappingURL=annual_report_engine.d.ts.map