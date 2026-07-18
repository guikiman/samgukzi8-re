/**
 * [Task 8] 턴 우선순위(Turn Initiative) 큐 빌더
 *
 * 무장의 행동력, 신분(군주/도독/태수/일반 등)에 기반하여
 * 턴이 동적으로 스케줄링되는 정렬 알고리즘.
 */

export type OfficerRank =
  | "ruler"
  | "prime_minister"
  | "governor"
  | "prefect"
  | "general";

export interface TurnEntry {
  readonly officerId: string;
  readonly initiative: number;
  readonly rank: OfficerRank;
  readonly agility: number;
}

const RANK_INITIATIVE: Record<OfficerRank, number> = {
  ruler: 100,
  prime_minister: 90,
  governor: 80,
  prefect: 70,
  general: 60,
};

export class TurnPriorityQueue {
  private entries: TurnEntry[] = [];

  buildQueue(
    officers: { id: string; rank: OfficerRank; agility: number }[],
  ): TurnEntry[] {
    this.entries = officers
      .map((o) => {
        const base = RANK_INITIATIVE[o.rank];
        const agilityBonus = Math.floor(o.agility * 0.5);
        return {
          officerId: o.id,
          initiative: base + agilityBonus,
          rank: o.rank,
          agility: o.agility,
        };
      })
      .sort((a, b) => b.initiative - a.initiative || b.agility - a.agility);

    return this.entries;
  }

  getQueue(): readonly TurnEntry[] {
    return this.entries;
  }

  reorderAfterTurn(): void {
    const first = this.entries.shift();
    if (first) {
      const penalty = Math.floor(first.initiative * 0.3);
      const reinsert: TurnEntry = {
        ...first,
        initiative: Math.max(first.initiative - penalty, 10),
      };
      const idx = this.entries.findIndex(
        (e) => e.initiative < reinsert.initiative,
      );
      if (idx === -1) this.entries.push(reinsert);
      else this.entries.splice(idx, 0, reinsert);
    }
  }
}
