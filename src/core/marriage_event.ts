/**
 * [17] 무장의 결혼 및 청혼 이벤트 — MarriageEvent
 * 
 * 목적: 결혼 및 배우자 버프 처리.
 */
import { GameEvent, EventPriority } from './event_trigger_registry';

export class MarriageEvent implements GameEvent {
    public readonly id = 'marriage';
    public readonly name = '결혼';
    public readonly type = 'MARRIAGE';
    public readonly priority: EventPriority = 'FICTIONAL';
    public readonly once = true;

    public condition(): boolean { return true; }
    public action(): void {
        console.log("결혼 이벤트: 배우자 관계 설정 및 버프 부여.");
    }
}
