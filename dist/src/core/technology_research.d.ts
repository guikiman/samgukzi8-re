/**
 * [E5] 기술(개발) 연구 체계 — Technology Research
 *
 * TechnologyResearch:
 *   1. 도시 기술 점수 누적, 1000/2000 돌파 시 기술서 획득
 *   2. 상위 병종(중보병, 호표기 등) 편제 권한 해금
 *   3. 연구 효율 = 무장 지력 × (1 + 연구 특기 보정)
 */
export type TechTier = 0 | 1 | 2 | 3;
export type UnlockableUnit = 'HEAVY_INFANTRY' | 'TIGER_CAVALRY' | 'CROSSBOW' | 'IRON_SHIELD';
export interface CityTechnology {
    readonly cityId: string;
    techPoints: number;
    currentTier: TechTier;
    unlockedUnits: UnlockableUnit[];
}
export interface ResearchResult {
    readonly techGain: number;
    readonly totalTechPoints: number;
    readonly tierUpgraded: boolean;
    readonly newTier: TechTier;
    readonly newlyUnlocked: UnlockableUnit[];
}
export declare class TechnologyResearch {
    private readonly MAX_TIER;
    research(city: CityTechnology, officerIntelligence: number, hasResearchSkill: boolean): ResearchResult;
    getTierThreshold(tier: TechTier): number;
    getUnlocksForTier(tier: TechTier): UnlockableUnit[];
}
//# sourceMappingURL=technology_research.d.ts.map