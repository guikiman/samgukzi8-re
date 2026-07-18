/**
 * [11] 무장 사망 및 상속 이벤트 — OfficerDeathInheritanceEvent
 *
 * 목적: 군주 사망 시 후계자 지명 및 세력 승계 처리.
 */
import { GameEvent, EventPriority } from './event_trigger_registry';
export declare class OfficerDeathInheritanceEvent implements GameEvent {
    readonly id = "officer_death_inheritance";
    readonly name = "\uBB34\uC7A5 \uC0AC\uB9DD \uBC0F \uC0C1\uC18D";
    readonly type = "DEATH_INHERITANCE";
    readonly priority: EventPriority;
    readonly once = true;
    condition(): boolean;
    action(): void;
}
//# sourceMappingURL=officer_death_inheritance_event.d.ts.map