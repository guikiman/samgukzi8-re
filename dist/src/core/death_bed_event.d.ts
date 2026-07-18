/**
 * [20] 임종 및 유서 전달 시나리오 — DeathBedEvent
 *
 * 목적: 사망 전 유산 전달.
 */
import { GameEvent, EventPriority } from './event_trigger_registry';
export declare class DeathBedEvent implements GameEvent {
    readonly id = "death_bed";
    readonly name = "\uC784\uC885 \uBC0F \uC720\uC11C";
    readonly type = "DEATH";
    readonly priority: EventPriority;
    readonly once = true;
    condition(): boolean;
    action(): void;
}
//# sourceMappingURL=death_bed_event.d.ts.map