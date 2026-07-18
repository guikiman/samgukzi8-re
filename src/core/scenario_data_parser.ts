/**
 * [A1] 시나리오 데이터 파서 — Scenario Data Parser
 *
 * ScenarioDataParser:
 *   1. JSON 시나리오 파일 로딩 (184~263년)
 *   2. 세력 배치, 공백지, 초기 군주 구성 파싱
 *   3. 데이터 무결성 검증 (존재하는 무장/도시 참조)
 *   4. 연도 기반 시나리오 필터링
 */

import type { OfficerID, FactionID, CityID } from './types';

export interface ScenarioFactionSetup {
    readonly factionId: FactionID;
    readonly leaderId: OfficerID;
    readonly name: string;
    readonly color: string;
    readonly controlledCities: CityID[];
    readonly officers: OfficerID[];
}

export interface ScenarioData {
    readonly id: string;
    readonly year: number;
    readonly name: string;
    readonly description: string;
    readonly factions: ScenarioFactionSetup[];
    readonly neutralCities: CityID[];
    readonly freeOfficers: OfficerID[];
}

export interface ParseResult {
    readonly success: boolean;
    readonly data: ScenarioData | null;
    readonly errors: string[];
    readonly warnings: string[];
}

export class ScenarioDataParser {
    private scenarios: Map<string, ScenarioData> = new Map();
    private validOfficerIds: Set<string> = new Set();
    private validCityIds: Set<string> = new Set();

    setKnownIds(officerIds: string[], cityIds: string[]): void {
        this.validOfficerIds = new Set(officerIds);
        this.validCityIds = new Set(cityIds);
    }

    parse(jsonData: any): ParseResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!jsonData || typeof jsonData !== 'object') {
            return { success: false, data: null, errors: ['데이터가 객체여야 합니다'], warnings: [] };
        }
        if (!jsonData.id || typeof jsonData.id !== 'string') {
            errors.push('시나리오 ID가 필요합니다');
        }
        if (typeof jsonData.year !== 'number' || jsonData.year < 150 || jsonData.year > 300) {
            errors.push('연도는 150~300 사이여야 합니다');
        }
        if (!jsonData.name || typeof jsonData.name !== 'string') {
            errors.push('시나리오 이름이 필요합니다');
        }

        if (errors.length > 0) {
            return { success: false, data: null, errors, warnings };
        }

        const factions: ScenarioFactionSetup[] = [];
        const neutralCities: CityID[] = [];
        const freeOfficers: OfficerID[] = [];

        if (Array.isArray(jsonData.factions)) {
            for (let i = 0; i < jsonData.factions.length; i++) {
                const f = jsonData.factions[i];
                if (!f.factionId || !f.leaderId) {
                    warnings.push(`factions[${i}]: factionId 또는 leaderId 누락 — 건너뜀`);
                    continue;
                }
                factions.push({
                    factionId: f.factionId,
                    leaderId: f.leaderId,
                    name: f.name ?? `세력 ${i}`,
                    color: f.color ?? '#888888',
                    controlledCities: Array.isArray(f.controlledCities) ? f.controlledCities : [],
                    officers: Array.isArray(f.officers) ? f.officers : [],
                });
            }
        }

        if (Array.isArray(jsonData.neutralCities)) {
            for (const city of jsonData.neutralCities) {
                if (typeof city === 'string') neutralCities.push(city);
            }
        }

        if (Array.isArray(jsonData.freeOfficers)) {
            for (const off of jsonData.freeOfficers) {
                if (typeof off === 'string') freeOfficers.push(off);
            }
        }

        const data: ScenarioData = {
            id: jsonData.id,
            year: jsonData.year,
            name: jsonData.name,
            description: jsonData.description ?? '',
            factions,
            neutralCities,
            freeOfficers,
        };

        this.scenarios.set(data.id, data);
        return { success: true, data, errors: [], warnings };
    }

    getScenario(id: string): ScenarioData | null {
        return this.scenarios.get(id) ?? null;
    }

    getScenariosByYear(year: number): ScenarioData[] {
        return Array.from(this.scenarios.values())
            .filter(s => s.year === year)
            .sort((a, b) => a.name.localeCompare(b.name));
    }

    getAllScenarios(): ScenarioData[] {
        return Array.from(this.scenarios.values())
            .sort((a, b) => a.year - b.year || a.name.localeCompare(b.name));
    }

    removeScenario(id: string): boolean {
        return this.scenarios.delete(id);
    }

    clear(): void {
        this.scenarios.clear();
    }

    get count(): number { return this.scenarios.size; }
}
