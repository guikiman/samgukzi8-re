/**
 * [5] 삼고초려 이벤트 분기 처리기 — ThreeVisitsEvent
 *
 * 목적: 유비의 융중 방문 횟수 누적 및 제갈량 하산 유도 이벤트.
 */
import { GameEvent, EventPriority } from './event_trigger_registry';
export declare class ThreeVisitsEvent implements GameEvent {
    readonly id = "three_visits";
    readonly name = "\uC0BC\uACE0\uCD08\uB824";
    readonly type = "VISIT";
    readonly priority: EventPriority;
    readonly once = true;
    private visitCount;
    condition(): boolean;
    action(): void;
}
//# sourceMappingURL=three_visits_event.d.ts.map