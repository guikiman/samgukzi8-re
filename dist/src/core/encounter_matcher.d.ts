/**
 * [23] 동적 인카운터(Encounter) 매칭 테이블 — EncounterMatcher
 *
 * EncounterMatcher:
 *   1. 무장 이동 경로 상에 존재하는 도적, 사냥감, 소생(의원) 등의 인카운터 확률 연산
 *   2. 지형, 치안, 계절에 따른 확률 테이블 기반 트리거
 *   3. 인카운터 발생 시 EventTriggerRegistry와 연동
 */
export type EncounterType = 'BANDIT' | 'HUNT' | 'HERMIT' | 'MERCHANT' | 'SAGE' | 'BEAST' | 'TRAVELER';
export interface EncounterDef {
    readonly type: EncounterType;
    readonly baseProbability: number;
    readonly terrainModifier: Record<string, number>;
    readonly seasonModifier: Record<string, number>;
    readonly safetyThreshold: number;
}
export interface EncounterContext {
    readonly terrain: string;
    readonly season: string;
    readonly publicOrder: number;
    readonly isNight: boolean;
    readonly officerFame: number;
}
export interface EncounterResult {
    readonly type: EncounterType;
    readonly probability: number;
    readonly triggered: boolean;
    readonly roll: number;
}
export declare class EncounterMatcher {
    private context;
    setContext(context: EncounterContext): void;
    rollForEncounter(context?: EncounterContext): EncounterResult | null;
    rollAll(context?: EncounterContext): EncounterResult[];
    getEncounterDef(type: EncounterType): EncounterDef | undefined;
    getAllEncounterDefs(): EncounterDef[];
}
//# sourceMappingURL=encounter_matcher.d.ts.map