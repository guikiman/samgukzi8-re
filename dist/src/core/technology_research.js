/**
 * [E5] 기술(개발) 연구 체계 — Technology Research
 *
 * TechnologyResearch:
 *   1. 도시 기술 점수 누적, 1000/2000 돌파 시 기술서 획득
 *   2. 상위 병종(중보병, 호표기 등) 편제 권한 해금
 *   3. 연구 효율 = 무장 지력 × (1 + 연구 특기 보정)
 */
const TIER_THRESHOLDS = {
    0: 0,
    1: 500,
    2: 1000,
    3: 2000,
};
const TIER_UNLOCKS = {
    0: [],
    1: ['HEAVY_INFANTRY'],
    2: ['HEAVY_INFANTRY', 'CROSSBOW'],
    3: ['HEAVY_INFANTRY', 'CROSSBOW', 'TIGER_CAVALRY', 'IRON_SHIELD'],
};
export class TechnologyResearch {
    constructor() {
        this.MAX_TIER = 3;
    }
    research(city, officerIntelligence, hasResearchSkill) {
        const skillBonus = hasResearchSkill ? 0.5 : 0;
        const efficiency = (officerIntelligence / 100 + skillBonus);
        const gain = Math.floor(efficiency * (10 + Math.random() * 10));
        city.techPoints += gain;
        const oldTier = city.currentTier;
        let newTier = city.currentTier;
        const newlyUnlocked = [];
        for (let t = newTier + 1; t <= this.MAX_TIER; t++) {
            if (city.techPoints >= TIER_THRESHOLDS[t]) {
                newTier = t;
                for (const unit of TIER_UNLOCKS[t]) {
                    if (!city.unlockedUnits.includes(unit)) {
                        city.unlockedUnits.push(unit);
                        newlyUnlocked.push(unit);
                    }
                }
            }
        }
        city.currentTier = newTier;
        return {
            techGain: gain,
            totalTechPoints: city.techPoints,
            tierUpgraded: newTier > oldTier,
            newTier,
            newlyUnlocked,
        };
    }
    getTierThreshold(tier) {
        return TIER_THRESHOLDS[tier];
    }
    getUnlocksForTier(tier) {
        return [...TIER_UNLOCKS[tier]];
    }
}
//# sourceMappingURL=technology_research.js.map