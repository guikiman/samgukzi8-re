/**
 * [19] 능력치 대비 라이벌 구도 자동 인카운터 생성기
 *
 * RivalEncounterGenerator:
 *   - Euclidean Distance d = sqrt(Σ(Ai - Bi)^2) ≤ 5 → 라이벌
 *   - 20% 확률로 특별 대립 일기토/설전 이벤트 발생
 */

import type { Officer, OfficerID, CityID, IGameStore } from './types.js';

export interface RivalPair {
    readonly officerA: OfficerID;
    readonly officerB: OfficerID;
    readonly distance: number;
    readonly nameA: string;
    readonly nameB: string;
    readonly eventType: 'DUEL' | 'DEBATE' | 'RIVALRY' | 'JEALOUSY';
}

export class RivalEncounterGenerator {
    private store: IGameStore;

    constructor(store: IGameStore) {
        this.store = store;
    }

    /**
     * [19] 매달 턴 평정 시 동일 도시 내 라이벌 스캔
     *
     * d = sqrt(Σ(Ai - Bi)^2) / 5 (stats: leadership, might, intelligence, politics, charisma)
     * d ≤ 5 → 20% 확률로 특별 이벤트 트리거
     */
    scanForRivals(cityId: CityID): RivalPair[] {
        const city = this.store.getCity(cityId);
        if (!city) return [];

        const officers = city.officerIds
            .map(id => this.store.getOfficer(id))
            .filter((o): o is Officer => o !== null);

        const rivals: RivalPair[] = [];

        for (let i = 0; i < officers.length; i++) {
            for (let j = i + 1; j < officers.length; j++) {
                const a = officers[i];
                const b = officers[j];
                const distance = this.computeStatDistance(a.stats, b.stats);

                if (distance <= 5 && Math.random() < 0.2) {
                    const eventType = this.determineEventType(a, b, distance);
                    rivals.push({
                        officerA: a.id, officerB: b.id,
                        distance,
                        nameA: a.name, nameB: b.name,
                        eventType,
                    });
                }
            }
        }

        return rivals;
    }

    private computeStatDistance(statsA: Officer['stats'], statsB: Officer['stats']): number {
        const keys: (keyof Officer['stats'])[] = ['leadership', 'might', 'intelligence', 'politics', 'charisma'];
        const sumSq = keys.reduce((sum, key) => {
            const diff = (statsA[key] ?? 50) - (statsB[key] ?? 50);
            return sum + diff * diff;
        }, 0);
        return Math.sqrt(sumSq / keys.length);
    }

    private determineEventType(a: Officer, b: Officer, distance: number): RivalPair['eventType'] {
        if (a.stats.might >= 80 && b.stats.might >= 80) return 'DUEL';
        if (a.stats.intelligence >= 80 && b.stats.intelligence >= 80) return 'DEBATE';
        if (distance <= 3) return 'JEALOUSY';
        return 'RIVALRY';
    }
}
