/**
 * [5] 삼고초려 이벤트 분기 처리기 — ThreeVisitsEvent
 * 
 * 목적: 유비의 융중 방문 횟수 누적 및 제갈량 하산 유도 이벤트.
 */

import { GameEvent, EventPriority } from './event_trigger_registry';

export class ThreeVisitsEvent implements GameEvent {
    public readonly id = 'three_visits';
    public readonly name = '삼고초려';
    public readonly type = 'VISIT';
    public readonly priority: EventPriority = 'HISTORICAL';
    public readonly once = true;
    private visitCount = 0;

    public condition(): boolean {
        return this.visitCount < 3;
    }

    public action(): void {
        this.visitCount++;
        console.log(`삼고초려 ${this.visitCount}회차 방문.`);
        if (this.visitCount === 3) {
            console.log("제갈량 하산 결심!");
        }
    }
}
