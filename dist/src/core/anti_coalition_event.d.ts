/**
 * [21] 세력 연합 결성 트리거 — AntiCoalitionEvent
 *
 * 목적: 강력한 세력에 대항하는 연합군 결성.
 */
import { GameEvent, EventPriority } from './event_trigger_registry';
export declare class AntiCoalitionEvent implements GameEvent {
    readonly id = "anti_coalition";
    readonly name = "\uBC18\uC870\uC870 \uC5F0\uD569";
    readonly type = "COALITION";
    readonly priority: EventPriority;
    readonly once = false;
    condition(): boolean;
    action(): void;
}
//# sourceMappingURL=anti_coalition_event.d.ts.map