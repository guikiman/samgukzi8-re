/**
 * 시나리오 시스템 — 로더 + 월드 빌더
 *
 * src/data/scenarios/index.json의 시나리오 목록을 불러와 선택 화면에 제공하고,
 * 선택된 시나리오를 GameStore에 넣을 Officer/Faction/City 배열로 변환한다.
 * 부분 [9] 시나리오 선택, [114] 시나리오 데이터 로딩
 */
import type { Officer, Faction, City } from './types.js';
export interface ScenarioFaction {
    name: string;
    capital: string;
    leader_id: string;
    color: string;
    /** 중국 전도 상의 도시 위치 (정규화 0~1, x: 서→동, y: 북→남) */
    map_x?: number;
    map_y?: number;
}
export interface ScenarioData {
    id: string;
    title_kr: string;
    title_en: string;
    start_date: string;
    description: string;
    difficulty: number;
    factions: ScenarioFaction[];
    special_conditions: {
        victory: string;
        historical_mode: boolean;
    };
    status: string;
}
export declare function loadScenarios(): Promise<ScenarioData[]>;
export declare function getCachedScenarios(): ScenarioData[];
/** 무장 아이디 → 한글 이름 (사전에 없으면 아이디 그대로) */
export declare function getKnownOfficerName(id: string): string;
export declare function parseStartDate(start: string): {
    year: number;
    month: number;
};
/**
 * 도시 이름 → 중국 전도 좌표 (정규화 0~1)
 * x: 서쪽 0 → 동쪽 1 / y: 북쪽 0 → 남쪽 1 (대략 중국 본토)
 */
export declare const CITY_MAP_COORDS: Record<string, {
    x: number;
    y: number;
}>;
export interface BuiltWorld {
    officers: Officer[];
    factions: Faction[];
    cities: City[];
    playerFactionId: string;
}
export declare function buildWorld(scenario: ScenarioData, playerFactionIndex: number): BuiltWorld;
//# sourceMappingURL=scenario_system.d.ts.map