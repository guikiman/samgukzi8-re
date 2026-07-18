/**
 * [17] 육아 스트레스 지수 및 '특기 유전 패턴 시뮬레이터'
 *
 * ChildRearingSystem:
 *   - 부모 장수 능력치의 유전 가중치 기반 자녀 스탯 상속
 *   - 훈육 방식에 따른 스트레스 지수 상관관계
 *   - 무장 유전자가 확률적으로 발현 및 돌연변이를 일으키는 DNA 매핑
 */
import type { OfficerStats } from './types.js';
export type ParentingStyle = 'strict' | 'gentle' | 'academic' | 'military' | 'free';
export interface ChildDNA {
    readonly inheritedStats: Partial<OfficerStats>;
    readonly mutatedTraits: readonly string[];
    readonly stressLevel: number;
    readonly inheritedTraits: readonly string[];
}
export declare class ChildRearingSystem {
    /**
     * [17] 자녀 능력치 유전 시뮬레이션
     *
     * 부모 능력치의 유전 가중치:
     *   childStat = (parent1Stat × 0.4 + parent2Stat × 0.4 + random(0, 20)) × stressModifier
     *
     * stressModifier:
     *   stress < 30 → 1.0 (정상)
     *   stress 30-60 → 0.9 (스트레스)
     *   stress > 60 → 0.7 (과도한 스트레스)
     */
    simulateInheritance(parent1Stats: Partial<OfficerStats>, parent2Stats: Partial<OfficerStats>, stressLevel: number): Partial<OfficerStats>;
    /**
     * [17] 특기 유전 — 부모 특기에서 자녀가 확률적으로 상속
     *
     * 상속 확률: 부모 특기당 30% (동일 특기 보유 시 50%)
     * 돌연변이 확률: 5%
     */
    simulateTraitInheritance(parentTraits: string[], childTraits: string[]): string[];
}
//# sourceMappingURL=child_rearing.d.ts.map