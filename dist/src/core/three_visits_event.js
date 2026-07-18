/**
 * [5] 삼고초려 이벤트 분기 처리기 — ThreeVisitsEvent
 *
 * 목적: 유비의 융중 방문 횟수 누적 및 제갈량 하산 유도 이벤트.
 */
export class ThreeVisitsEvent {
    constructor() {
        this.id = 'three_visits';
        this.name = '삼고초려';
        this.type = 'VISIT';
        this.priority = 'HISTORICAL';
        this.once = true;
        this.visitCount = 0;
    }
    condition() {
        return this.visitCount < 3;
    }
    action() {
        this.visitCount++;
        console.log(`삼고초려 ${this.visitCount}회차 방문.`);
        if (this.visitCount === 3) {
            console.log("제갈량 하산 결심!");
        }
    }
}
//# sourceMappingURL=three_visits_event.js.map