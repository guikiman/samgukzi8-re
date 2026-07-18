/**
 * [2] TurnQueue — 우선순위 힙
 * 
 * 목적: 무장 속도 기반 행동 우선순위 정렬.
 */
export class TurnQueue<T extends { speed: number }> {
    private queue: T[] = [];
    public push(item: T): void {
        this.queue.push(item);
        this.queue.sort((a, b) => b.speed - a.speed);
    }
    public pop(): T | undefined { return this.queue.shift(); }
}
