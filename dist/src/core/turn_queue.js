/**
 * [2] TurnQueue — 우선순위 힙
 *
 * 목적: 무장 속도 기반 행동 우선순위 정렬.
 */
export class TurnQueue {
    constructor() {
        this.queue = [];
    }
    push(item) {
        this.queue.push(item);
        this.queue.sort((a, b) => b.speed - a.speed);
    }
    pop() { return this.queue.shift(); }
}
//# sourceMappingURL=turn_queue.js.map