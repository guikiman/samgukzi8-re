/**
 * [2] TurnQueue — 우선순위 힙
 *
 * 목적: 무장 속도 기반 행동 우선순위 정렬.
 */
export declare class TurnQueue<T extends {
    speed: number;
}> {
    private queue;
    push(item: T): void;
    pop(): T | undefined;
}
//# sourceMappingURL=turn_queue.d.ts.map