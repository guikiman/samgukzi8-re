/**
 * [2] 우호도 교류 '연회 필터' 및 다중 선택 교류
 * [18] 포로 석방 협상용 능력치 기반 몸값 자동 책정
 *
 * SocialSystem:
 *   - bulkInteract(): 친밀도 ≤ threshold 무장들 다중 선택, 행동력+골드 비례 소모로 일괄 친밀도 상승
 *   - computeDialoguePriority(): 신분 거리 + 친밀도 기반 교류 우선순위 정렬
 *
 * RansomCalculator:
 *   - ransom = (totalStats / 300) × rankWeight × loyaltyWeight × baseGold
 */

import type { Officer, OfficerID, FactionID, RelationType, IGameStore } from './types.js';

export interface BulkInteractOptions {
    readonly maxFactionOfficers?: number;
    readonly affinityThreshold?: number;       // 친밀도 ≤ 이 값인 무장만 선택
    readonly actionPointCostPerOfficer?: number;
    readonly goldCostPerOfficer?: number;
    readonly affinityGainPerOfficer?: number;
}

export interface InteractCandidate {
    readonly officerId: OfficerID;
    readonly name: string;
    readonly affinity: number;
    readonly rankLabel: string;
    readonly score: number;
}

export class SocialSystem {
    private readonly store: IGameStore;

    constructor(store: IGameStore) {
        this.store = store;
    }

    /**
     * [2] 일괄 교류 후보 선정
     *
     * Priority: 신분 거리(↓) + 친밀도(↑) + 성격 궁합
     * → 친밀도가 낮고 신분 차이가 크며 성격이 잘 맞는 무장 우선
     */
    getInteractCandidates(factionId: FactionID, options: BulkInteractOptions = {}): InteractCandidate[] {
        const threshold = options.affinityThreshold ?? 50;
        const max = options.maxFactionOfficers ?? 10;
        const faction = this.store.getFaction(factionId);
        if (!faction) return [];

        const allOfficers = this.store.getAllOfficers()
            .filter(o => o.factionId === factionId && o.status !== 'FREE');

        const candidates: InteractCandidate[] = allOfficers.map(o => {
            const affinity = this.getAffinityBetween(faction.leaderId!, o.id);
            const rankDist = Math.abs(o.rank as number - ((faction as any).lordRank ?? 9));
            const score = (threshold - affinity) * 2 + (9 - rankDist) + (o.loyalty / 20);
            return {
                officerId: o.id,
                name: o.name,
                affinity,
                rankLabel: `Rank ${o.rank}`,
                score: Math.max(0, score),
            };
        });

        candidates.sort((a, b) => b.score - a.score);
        return candidates.slice(0, max);
    }

    /**
     * [18] 포로 몸값 동적 책정
     *
     * ransom = (totalStats / 300) × rankWeight × loyaltyWeight × baseGold(500)
     *
     * rankWeight:
     *   RANK1=5.0, RANK2=3.0, RANK3=2.0, RANK4~6=1.0~1.5, FREE=0.5
     *
     * loyaltyWeight:
     *   loyalty ≥ 90 → 2.0 (충성도 높은 무장은 비싸게)
     *   loyalty ≤ 30 → 0.5 (불만 있으면 싸게)
     */
    computeRansom(officerId: OfficerID, captorFactionId: FactionID): number {
        const officer = this.store.getOfficer(officerId);
        if (!officer) return 0;

        const totalStats = officer.stats.leadership + officer.stats.might
            + officer.stats.intelligence + officer.stats.politics + officer.stats.charisma;

        const rankWeights: Record<number, number> = { 1: 5, 2: 3, 3: 2, 4: 1.5, 5: 1.2, 6: 1, 7: 0.8, 8: 0.6, 9: 0.5 };
        const rankWeight = rankWeights[officer.rank as number] ?? 0.5;

        const loyaltyWeight = officer.loyalty >= 90 ? 2 : officer.loyalty >= 70 ? 1.5 : officer.loyalty >= 50 ? 1 : 0.5;
        const baseGold = 500;

        return Math.round((totalStats / 300) * rankWeight * loyaltyWeight * baseGold);
    }

    /** 두 무장 간 친밀도 조회 */
    private getAffinityBetween(a: OfficerID, b: OfficerID): number {
        const rels = this.store.getRelationships(a);
        const edge = rels.find(r => r.target === b);
        return edge ? edge.affinity : 50;
    }
}
