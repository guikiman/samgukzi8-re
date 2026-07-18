/**
 * [11] 무장 유전자 조합기 — Officer Genealogy Combiner
 *
 * 육아 시스템에서 부모의 스탯 데이터(능력치, 특기, 성향)를
 * 정규분포 상에서 교차 조합하여 2세대 무장 데이터로 정형화
 */
import type { OfficerStats, OfficerID, Personality } from './types.js';
export interface ChildData {
    childId: OfficerID;
    parentId: OfficerID;
    talentScore: number;
    stats: OfficerStats;
    personality: Personality;
}
export declare class OfficerGenealogyCombiner {
    private children;
    /**
     * 입양
     */
    adoptChild(parentId: OfficerID, childId: OfficerID): ChildData;
    /**
     * 부모 능력치 교차 조합 (정규분포 crossover)
     *
     * 자식 능력치 = (parent1 + parent2) / 2 ± 10% mutation
     */
    combineGenes(parent1: OfficerStats, parent2: OfficerStats, childBaseStats?: Partial<OfficerStats>): OfficerStats;
    /**
     * 성장 처리 (매년)
     */
    processMaturation(childId: OfficerID): ChildData | null;
    getChild(childId: OfficerID): ChildData | null;
    getChildrenByParent(parentId: OfficerID): ChildData[];
    getAllChildren(): ChildData[];
    removeChild(childId: OfficerID): boolean;
    reset(): void;
}
//# sourceMappingURL=officer_genealogy_combiner.d.ts.map