/**
 * [23] 동적 인카운터(Encounter) 매칭 테이블 — EncounterMatcher
 *
 * EncounterMatcher:
 *   1. 무장 이동 경로 상에 존재하는 도적, 사냥감, 소생(의원) 등의 인카운터 확률 연산
 *   2. 지형, 치안, 계절에 따른 확률 테이블 기반 트리거
 *   3. 인카운터 발생 시 EventTriggerRegistry와 연동
 */
const ENCOUNTER_TABLE = [
    {
        type: 'BANDIT',
        baseProbability: 0.15,
        terrainModifier: { MOUNTAIN: 2.0, FOREST: 1.5, PLAIN: 0.8, RIVER: 1.2 },
        seasonModifier: { SPRING: 1.0, SUMMER: 1.2, AUTUMN: 0.8, WINTER: 0.6 },
        safetyThreshold: 60,
    },
    {
        type: 'HUNT',
        baseProbability: 0.10,
        terrainModifier: { FOREST: 2.0, MOUNTAIN: 1.5, PLAIN: 1.0, RIVER: 0.8 },
        seasonModifier: { SPRING: 0.8, SUMMER: 1.0, AUTUMN: 1.5, WINTER: 0.7 },
        safetyThreshold: 100,
    },
    {
        type: 'HERMIT',
        baseProbability: 0.05,
        terrainModifier: { MOUNTAIN: 2.5, FOREST: 1.8, PLAIN: 0.5, RIVER: 0.3 },
        seasonModifier: { SPRING: 1.2, SUMMER: 0.8, AUTUMN: 1.0, WINTER: 0.6 },
        safetyThreshold: 100,
    },
    {
        type: 'MERCHANT',
        baseProbability: 0.12,
        terrainModifier: { PLAIN: 2.0, RIVER: 1.5, FOREST: 0.6, MOUNTAIN: 0.3 },
        seasonModifier: { SPRING: 1.0, SUMMER: 1.2, AUTUMN: 1.1, WINTER: 0.7 },
        safetyThreshold: 100,
    },
    {
        type: 'SAGE',
        baseProbability: 0.03,
        terrainModifier: { MOUNTAIN: 2.0, FOREST: 1.5, RIVER: 1.2, PLAIN: 0.8 },
        seasonModifier: { SPRING: 1.5, SUMMER: 0.7, AUTUMN: 1.2, WINTER: 0.6 },
        safetyThreshold: 100,
    },
    {
        type: 'BEAST',
        baseProbability: 0.08,
        terrainModifier: { FOREST: 2.5, MOUNTAIN: 1.8, PLAIN: 0.5, RIVER: 0.4 },
        seasonModifier: { SPRING: 0.6, SUMMER: 1.3, AUTUMN: 1.5, WINTER: 0.6 },
        safetyThreshold: 100,
    },
    {
        type: 'TRAVELER',
        baseProbability: 0.07,
        terrainModifier: { PLAIN: 2.0, RIVER: 1.8, FOREST: 0.4, MOUNTAIN: 0.3 },
        seasonModifier: { SPRING: 1.2, SUMMER: 1.5, AUTUMN: 1.0, WINTER: 0.3 },
        safetyThreshold: 100,
    },
];
export class EncounterMatcher {
    constructor() {
        this.context = null;
    }
    setContext(context) {
        this.context = context;
    }
    rollForEncounter(context) {
        const ctx = context ?? this.context;
        if (!ctx)
            return null;
        const candidates = [];
        for (const def of ENCOUNTER_TABLE) {
            const terrainMod = def.terrainModifier[ctx.terrain] ?? 1.0;
            const seasonMod = def.seasonModifier[ctx.season] ?? 1.0;
            const safetyFactor = ctx.publicOrder < def.safetyThreshold ? 1.5 : 0.5;
            const nightFactor = ctx.isNight ? 1.3 : 1.0;
            const fameFactor = def.type === 'SAGE' || def.type === 'HERMIT'
                ? Math.min(2.0, ctx.officerFame / 50)
                : 1.0;
            const probability = def.baseProbability * terrainMod * seasonMod * safetyFactor * nightFactor * fameFactor;
            candidates.push({ def, probability });
        }
        // 확률 높은 순 정렬
        candidates.sort((a, b) => b.probability - a.probability);
        const top = candidates[0];
        const roll = Math.random();
        const triggered = roll < top.probability;
        return {
            type: top.def.type,
            probability: Math.round(top.probability * 10000) / 10000,
            triggered,
            roll: Math.round(roll * 10000) / 10000,
        };
    }
    rollAll(context) {
        const ctx = context ?? this.context;
        if (!ctx)
            return [];
        return ENCOUNTER_TABLE.map(def => {
            const terrainMod = def.terrainModifier[ctx.terrain] ?? 1.0;
            const seasonMod = def.seasonModifier[ctx.season] ?? 1.0;
            const safetyFactor = ctx.publicOrder < def.safetyThreshold ? 1.5 : 0.5;
            const probability = def.baseProbability * terrainMod * seasonMod * safetyFactor;
            const roll = Math.random();
            const triggered = roll < probability;
            return {
                type: def.type,
                probability: Math.round(probability * 10000) / 10000,
                triggered,
                roll: Math.round(roll * 10000) / 10000,
            };
        });
    }
    getEncounterDef(type) {
        return ENCOUNTER_TABLE.find(d => d.type === type);
    }
    getAllEncounterDefs() {
        return [...ENCOUNTER_TABLE];
    }
}
//# sourceMappingURL=encounter_matcher.js.map