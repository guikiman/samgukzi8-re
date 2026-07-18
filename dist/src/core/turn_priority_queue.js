/**
 * [Task 8] 턴 우선순위(Turn Initiative) 큐 빌더
 *
 * 무장의 행동력, 신분(군주/도독/태수/일반 등)에 기반하여
 * 턴이 동적으로 스케줄링되는 정렬 알고리즘.
 */
const RANK_INITIATIVE = {
    ruler: 100,
    prime_minister: 90,
    governor: 80,
    prefect: 70,
    general: 60,
};
export class TurnPriorityQueue {
    constructor() {
        this.entries = [];
    }
    buildQueue(officers) {
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
    getQueue() {
        return this.entries;
    }
    reorderAfterTurn() {
        const first = this.entries.shift();
        if (first) {
            const penalty = Math.floor(first.initiative * 0.3);
            const reinsert = {
                ...first,
                initiative: Math.max(first.initiative - penalty, 10),
            };
            const idx = this.entries.findIndex((e) => e.initiative < reinsert.initiative);
            if (idx === -1)
                this.entries.push(reinsert);
            else
                this.entries.splice(idx, 0, reinsert);
        }
    }
}
//# sourceMappingURL=turn_priority_queue.js.map