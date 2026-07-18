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
export declare class ScenarioDataParser {
    private scenarios;
    private validOfficerIds;
    private validCityIds;
    setKnownIds(officerIds: string[], cityIds: string[]): void;
    parse(jsonData: any): ParseResult;
    getScenario(id: string): ScenarioData | null;
    getScenariosByYear(year: number): ScenarioData[];
    getAllScenarios(): ScenarioData[];
    removeScenario(id: string): boolean;
    clear(): void;
    get count(): number;
}
//# sourceMappingURL=scenario_data_parser.d.ts.map