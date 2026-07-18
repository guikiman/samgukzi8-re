/**
 * [21] 정보상 이벤트 — InformationMerchantEvent
 * 
 * 목적: 첩보 단계에서 정보를 제공.
 */
import { GameEvent, EventPriority } from './event_trigger_registry';

export class InformationMerchantEvent implements GameEvent {
    public readonly id = 'information_merchant';
    public readonly name = '정보상';
    public readonly type = 'INTELLIGENCE';
    public readonly priority: EventPriority = 'DIPLOMACY';
    public readonly once = false;

    public condition(): boolean { return true; }
    public action(): void {
        console.log("정보상: 특정 무장의 위치 및 상태 확인.");
    }
}
