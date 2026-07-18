/**
 * [17] 무장의 결혼 및 청혼 이벤트 — MarriageEvent
 *
 * 목적: 결혼 및 배우자 버프 처리.
 */
import { GameEvent, EventPriority } from './event_trigger_registry';
export declare class MarriageEvent implements GameEvent {
    readonly id = "marriage";
    readonly name = "\uACB0\uD63C";
    readonly type = "MARRIAGE";
    readonly priority: EventPriority;
    readonly once = true;
    condition(): boolean;
    action(): void;
}
//# sourceMappingURL=marriage_event.d.ts.map