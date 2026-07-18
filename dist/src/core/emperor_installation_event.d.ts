/**
 * [14] 황제 옹립 이벤트 — EmperorInstallationEvent
 *
 * 목적: 황제 옹립 후 천하 선포.
 */
import { GameEvent, EventPriority } from './event_trigger_registry';
export declare class EmperorInstallationEvent implements GameEvent {
    readonly id = "emperor_installation";
    readonly name = "\uD669\uC81C \uC639\uB9BD";
    readonly type = "EMPEROR";
    readonly priority: EventPriority;
    readonly once = true;
    condition(): boolean;
    action(): void;
}
//# sourceMappingURL=emperor_installation_event.d.ts.map