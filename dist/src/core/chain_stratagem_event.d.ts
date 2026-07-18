/**
 * [12] 연계 책략 이벤트 — ChainStratagemEvent
 *
 * 목적: 전술 전투 중 연계 책략.
 */
import { GameEvent, EventPriority } from './event_trigger_registry';
export declare class ChainStratagemEvent implements GameEvent {
    readonly id = "chain_stratagem";
    readonly name = "\uC5F0\uACC4 \uCC45\uB7B5";
    readonly type = "STRATAGEM";
    readonly priority: EventPriority;
    readonly once = false;
    condition(): boolean;
    action(): void;
}
//# sourceMappingURL=chain_stratagem_event.d.ts.map