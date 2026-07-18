/**
 * [6] 조조 항복 이벤트 — CaoCaoSurrenderEvent
 *
 * 목적: 특정 조건 충족 시 조조 항복.
 */
import { GameEvent, EventPriority } from './event_trigger_registry';
export declare class CaoCaoSurrenderEvent implements GameEvent {
    readonly id = "cao_cao_surrender";
    readonly name = "\uC870\uC870 \uD56D\uBCF5";
    readonly type = "SURRENDER";
    readonly priority: EventPriority;
    readonly once = true;
    condition(): boolean;
    action(): void;
}
//# sourceMappingURL=cao_cao_surrender_event.d.ts.map