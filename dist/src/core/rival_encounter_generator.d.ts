/**
 * [19] 능력치 대비 라이벌 구도 자동 인카운터 생성기
 *
 * RivalEncounterGenerator:
 *   - Euclidean Distance d = sqrt(Σ(Ai - Bi)^2) ≤ 5 → 라이벌
 *   - 20% 확률로 특별 대립 일기토/설전 이벤트 발생
 */
import type { OfficerID, CityID, IGameStore } from './types.js';
export interface RivalPair {
    readonly officerA: OfficerID;
    readonly officerB: OfficerID;
    readonly distance: number;
    readonly nameA: string;
    readonly nameB: string;
    readonly eventType: 'DUEL' | 'DEBATE' | 'RIVALRY' | 'JEALOUSY';
}
export declare class RivalEncounterGenerator {
    private store;
    constructor(store: IGameStore);
    /**
     * [19] 매달 턴 평정 시 동일 도시 내 라이벌 스캔
     *
     * d = sqrt(Σ(Ai - Bi)^2) / 5 (stats: leadership, might, intelligence, politics, charisma)
     * d ≤ 5 → 20% 확률로 특별 이벤트 트리거
     */
    scanForRivals(cityId: CityID): RivalPair[];
    private computeStatDistance;
    private determineEventType;
}
//# sourceMappingURL=rival_encounter_generator.d.ts.map