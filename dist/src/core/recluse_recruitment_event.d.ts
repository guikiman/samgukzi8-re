/**
 * [12] 재야 무장 방문 및 등용 권유 — RecluseRecruitmentEvent
 *
 * 목적: 재야 무장 방문 및 등용 이벤트.
 */
import { GameEvent, EventPriority } from './event_trigger_registry';
export declare class RecluseRecruitmentEvent implements GameEvent {
    readonly id = "recluse_recruitment";
    readonly name = "\uC7AC\uC57C \uBB34\uC7A5 \uB4F1\uC6A9";
    readonly type = "RECRUITMENT";
    readonly priority: EventPriority;
    readonly once = false;
    condition(): boolean;
    action(): void;
}
//# sourceMappingURL=recluse_recruitment_event.d.ts.map