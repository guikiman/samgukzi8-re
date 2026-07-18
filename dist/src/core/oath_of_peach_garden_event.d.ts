/**
 * [4] 도원결의 이벤트 트리거 — OathOfPeachGardenEvent
 *
 * 목적: 유비, 관우, 장비의 의형제 결성 및 관계 가중치 고정 이벤트.
 */
import { GameEvent, EventPriority } from './event_trigger_registry';
export declare class OathOfPeachGardenEvent implements GameEvent {
    readonly id = "oath_of_peach_garden";
    readonly name = "\uB3C4\uC6D0\uACB0\uC758";
    readonly type = "OATH";
    readonly priority: EventPriority;
    readonly once = true;
    condition(): boolean;
    action(): void;
}
//# sourceMappingURL=oath_of_peach_garden_event.d.ts.map