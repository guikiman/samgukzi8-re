/**
 * [21] 정보상 이벤트 — InformationMerchantEvent
 *
 * 목적: 첩보 단계에서 정보를 제공.
 */
import { GameEvent, EventPriority } from './event_trigger_registry';
export declare class InformationMerchantEvent implements GameEvent {
    readonly id = "information_merchant";
    readonly name = "\uC815\uBCF4\uC0C1";
    readonly type = "INTELLIGENCE";
    readonly priority: EventPriority;
    readonly once = false;
    condition(): boolean;
    action(): void;
}
//# sourceMappingURL=information_merchant_event.d.ts.map