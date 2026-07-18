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
import type { OfficerID, FactionID, IGameStore } from './types.js';
export interface BulkInteractOptions {
    readonly maxFactionOfficers?: number;
    readonly affinityThreshold?: number;
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
export declare class SocialSystem {
    private readonly store;
    constructor(store: IGameStore);
    /**
     * [2] 일괄 교류 후보 선정
     *
     * Priority: 신분 거리(↓) + 친밀도(↑) + 성격 궁합
     * → 친밀도가 낮고 신분 차이가 크며 성격이 잘 맞는 무장 우선
     */
    getInteractCandidates(factionId: FactionID, options?: BulkInteractOptions): InteractCandidate[];
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
    computeRansom(officerId: OfficerID, captorFactionId: FactionID): number;
    /** 두 무장 간 친밀도 조회 */
    private getAffinityBetween;
}
//# sourceMappingURL=social_system.d.ts.map