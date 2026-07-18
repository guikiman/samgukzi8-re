/**
 * [8] 반란/도적 출현 이벤트 — RebellionBanditEvent
 *
 * 목적: 치안 불량 지역 반란.
 */
import { GameEvent, EventPriority } from './event_trigger_registry';
export declare class RebellionBanditEvent implements GameEvent {
    readonly id = "rebellion_bandit";
    readonly name = "\uBC18\uB780/\uB3C4\uC801 \uCD9C\uD604";
    readonly type = "REBELLION";
    readonly priority: EventPriority;
    readonly once = false;
    condition(): boolean;
    action(): void;
}
//# sourceMappingURL=rebellion_bandit_event.d.ts.map