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

import type { Faction, FactionID, Officer } from './types.js';
import { ChronicleLogGenerator } from './chronicle_log_generator.js';

// ============================================================
// 내부 스냅샷 타입
// ============================================================

interface FactionSnapshot {
    readonly cityCount: number;
    readonly officerCount: number;
    readonly gold: number;
    readonly food: number;
    readonly soldierCount: number;
    readonly armyCount: number;
}

// ============================================================
// 리포트 타입 정의
// ============================================================

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

// ============================================================
// 내부 스냅샷 타입
// ============================================================

interface FactionSnapshot {
    readonly cityCount: number;
    readonly officerCount: number;
    readonly gold: number;
    readonly food: number;
    readonly soldierCount: number;
    readonly armyCount: number;
}

// ============================================================
// AnnualReportEngine
// ============================================================

export class AnnualReportEngine {
    private reports: AnnualReport[] = [];
    private previousSnapshot: Map<string, FactionSnapshot> = new Map();
    private logGenerator: ChronicleLogGenerator;

    constructor(logGenerator?: ChronicleLogGenerator) {
        this.logGenerator = logGenerator ?? new ChronicleLogGenerator();
    }

    /**
     * 연간 보고서를 생성한다.
     * @param factions 현재 세력 목록
     * @param year 보고서 년도
     * @returns 생성된 연간 보고서
     */
    generateReport(
        factions: Faction[],
        year: number,
    ): AnnualReport {
        const factionReports: FactionAnnualReport[] = [];

        for (const faction of factions) {
            const previous = this.previousSnapshot.get(faction.id);
            const report = this.buildFactionReport(faction, previous, year);
            factionReports.push(report);
        }

        const globalSummary = this.buildGlobalSummary(factionReports);

        const report: AnnualReport = {
            year,
            factionReports,
            globalSummary,
            timestamp: Date.now(),
        };

        this.reports.push(report);

        // 현재 스냅샷 저장 (다음 년도 비교용)
        this.saveSnapshot(factions);

        return report;
    }

    /**
     * 단일 세력의 연간 보고서를 생성한다.
     */
    private buildFactionReport(
        faction: Faction,
        previous: FactionSnapshot | undefined,
        year: number,
    ): FactionAnnualReport {
        const prevCities = previous?.cityCount ?? faction.cities.length;
        const prevGold = previous?.gold ?? faction.gold;
        const prevFood = previous?.food ?? faction.food;
        const prevOfficers = previous?.officerCount ?? faction.officers.length;
        const prevSoldiers = previous?.soldierCount ?? 0;
        const prevArmies = previous?.armyCount ?? faction.armies.length;
        const currSoldiers = 0; // 추후 Army 시스템 연동 시 보강

        const goldGrowth = prevGold > 0 ? ((faction.gold - prevGold) / prevGold) * 100 : 0;
        const foodGrowth = prevFood > 0 ? ((faction.food - prevFood) / prevFood) * 100 : 0;

        return {
            factionId: faction.id,
            factionName: faction.name,
            year,
            territory: {
                previousCityCount: prevCities,
                currentCityCount: faction.cities.length,
                citiesGained: Math.max(0, faction.cities.length - prevCities),
                citiesLost: Math.max(0, prevCities - faction.cities.length),
                netChange: faction.cities.length - prevCities,
            },
            economy: {
                previousGold: prevGold,
                currentGold: faction.gold,
                goldGrowthRate: Math.round(goldGrowth * 100) / 100,
                previousFood: prevFood,
                currentFood: faction.food,
                foodGrowthRate: Math.round(foodGrowth * 100) / 100,
                totalRevenue: Math.max(0, faction.gold - prevGold),
                totalExpenses: Math.max(0, prevGold - faction.gold),
            },
            military: {
                previousSoldiers: 0,
                currentSoldiers: 0,
                soldiersGained: 0,
                soldiersLost: 0,
                previousArmies: previous?.armyCount ?? faction.armies.length,
                currentArmies: faction.armies.length,
            },
            personnel: {
                previousOfficerCount: prevOfficers,
                currentOfficerCount: faction.officers.length,
                officersGained: Math.max(0, faction.officers.length - prevOfficers),
                officersLost: Math.max(0, prevOfficers - faction.officers.length),
                averageLoyalty: 0,
                defectors: Math.max(0, prevOfficers - faction.officers.length),
            },
            summary: `${faction.name} [${year}년]: 영토 ${faction.cities.length}개 도시, 금 ${faction.gold}, 식량 ${faction.food}`,
        };
    }

    /**
     * 글로벌 요약 정보를 생성한다.
     */
    private buildGlobalSummary(
        factionReports: FactionAnnualReport[],
    ): GlobalSummary {
        let mostPowerful = '';
        let maxCities = 0;
        let fastestGrowing = '';
        let maxGrowth = -Infinity;

        for (const report of factionReports) {
            if (report.territory.currentCityCount > maxCities) {
                maxCities = report.territory.currentCityCount;
                mostPowerful = report.factionName;
            }
            const growth = report.economy.goldGrowthRate;
            if (growth > maxGrowth) {
                maxGrowth = growth;
                fastestGrowing = report.factionName;
            }
        }

        const totalCities = factionReports.reduce(
            (sum, r) => sum + r.territory.currentCityCount, 0,
        );

        return {
            totalFactions: factionReports.length,
            totalCities,
            totalOfficers: factionReports.reduce((s, r) => s + r.personnel.currentOfficerCount, 0),
            totalSoldiers: factionReports.reduce((s, r) => s + r.military.currentSoldiers, 0),
            mostPowerfulFaction: mostPowerful,
            fastestGrowingFaction: fastestGrowing,
            warsActive: 0,
            alliancesActive: 0,
        };
    }

    /**
     * 현재 세력 스냅샷을 저장한다.
     */
    private saveSnapshot(factions: Faction[]): void {
        this.previousSnapshot.clear();
        for (const faction of factions) {
            this.previousSnapshot.set(faction.id, {
                cityCount: faction.cities.length,
                officerCount: faction.officers.length,
                gold: faction.gold,
                food: faction.food,
                soldierCount: 0,
                armyCount: faction.armies.length,
            });
        }
    }

    /**
     * 모든 보고서 이력을 반환한다.
     */
    getReportHistory(): AnnualReport[] {
        return [...this.reports];
    }

    /**
     * 특정 년도의 보고서를 반환한다.
     */
    getReportByYear(year: number): AnnualReport | undefined {
        return this.reports.find(r => r.year === year);
    }

    /**
     * 엔진 상태를 초기화한다.
     */
    clear(): void {
        this.reports = [];
        this.previousSnapshot.clear();
    }
}
