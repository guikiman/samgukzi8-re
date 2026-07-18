/**
 * [Task 8] 턴 우선순위(Turn Initiative) 큐 빌더
 *
 * 무장의 행동력, 신분(군주/도독/태수/일반 등)에 기반하여
 * 턴이 동적으로 스케줄링되는 정렬 알고리즘.
 */
export type OfficerRank = "ruler" | "prime_minister" | "governor" | "prefect" | "general";
export interface TurnEntry {
    readonly officerId: string;
    readonly initiative: number;
    readonly rank: OfficerRank;
    readonly agility: number;
}
export declare class TurnPriorityQueue {
    private entries;
    buildQueue(officers: {
        id: string;
        rank: OfficerRank;
        agility: number;
    }[]): TurnEntry[];
    getQueue(): readonly TurnEntry[];
    reorderAfterTurn(): void;
}
//# sourceMappingURL=turn_priority_queue.d.ts.map