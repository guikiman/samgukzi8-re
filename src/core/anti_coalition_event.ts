/**
 * [21] 세력 연합 결성 트리거 — AntiCoalitionEvent
 * 
 * 목적: 강력한 세력에 대항하는 연합군 결성.
 */
import { GameEvent, EventPriority } from './event_trigger_registry';

export class AntiCoalitionEvent implements GameEvent {
    public readonly id = 'anti_coalition';
    public readonly name = '반조조 연합';
    public readonly type = 'COALITION';
    public readonly priority: EventPriority = 'DIPLOMACY';
    public readonly once = false;

    public condition(): boolean { return true; }
    public action(): void {
        console.log("반조조 연합 발동: 주변 세력과 연합군 결성.");
    }
}
