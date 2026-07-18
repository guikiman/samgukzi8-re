/**
 * [17] 육아 스트레스 지수 및 '특기 유전 패턴 시뮬레이터'
 *
 * ChildRearingSystem:
 *   - 부모 장수 능력치의 유전 가중치 기반 자녀 스탯 상속
 *   - 훈육 방식에 따른 스트레스 지수 상관관계
 *   - 무장 유전자가 확률적으로 발현 및 돌연변이를 일으키는 DNA 매핑
 */

import type { OfficerStats, IGameStore } from './types.js';

export type ParentingStyle = 'strict' | 'gentle' | 'academic' | 'military' | 'free';

export interface ChildDNA {
    readonly inheritedStats: Partial<OfficerStats>;
    readonly mutatedTraits: readonly string[];
    readonly stressLevel: number;
    readonly inheritedTraits: readonly string[];
}

export class ChildRearingSystem {
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
    simulateInheritance(
        parent1Stats: Partial<OfficerStats>,
        parent2Stats: Partial<OfficerStats>,
        stressLevel: number,
    ): Partial<OfficerStats> {
        const stressModifier = stressLevel < 30 ? 1.0 : stressLevel < 60 ? 0.9 : 0.7;
        const inherited: Partial<OfficerStats> = {};

        const statKeys: (keyof OfficerStats)[] = ['leadership', 'might', 'intelligence', 'politics', 'charisma'];
        for (const key of statKeys) {
            const p1 = (parent1Stats[key] ?? 50) * 0.4;
            const p2 = (parent2Stats[key] ?? 50) * 0.4;
            const randomFactor = Math.random() * 20;
            inherited[key] = Math.round(Math.min(100, (p1 + p2 + randomFactor) * stressModifier));
        }

        return inherited;
    }

    /**
     * [17] 특기 유전 — 부모 특기에서 자녀가 확률적으로 상속
     *
     * 상속 확률: 부모 특기당 30% (동일 특기 보유 시 50%)
     * 돌연변이 확률: 5%
     */
    simulateTraitInheritance(parentTraits: string[], childTraits: string[]): string[] {
        const inherited: string[] = [...childTraits];

        for (const trait of parentTraits) {
            const parentCount = parentTraits.filter(t => t === trait).length;
            const inheritChance = parentCount >= 2 ? 0.5 : 0.3;
            if (Math.random() < inheritChance && !inherited.includes(trait)) {
                inherited.push(trait);
            }
        }

        // 돌연변이: 5% 확률로 새로운 특기 획득
        if (Math.random() < 0.05) {
            const mutations = ['genius', 'brave', 'calm', 'ambitious', 'lucky'];
            const newTrait = mutations[Math.floor(Math.random() * mutations.length)];
            if (!inherited.includes(newTrait)) inherited.push(newTrait);
        }

        return inherited;
    }
}
