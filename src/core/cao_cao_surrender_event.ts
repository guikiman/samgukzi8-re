/**
 * [6] 조조 항복 이벤트 — CaoCaoSurrenderEvent
 * 
 * 목적: 특정 조건 충족 시 조조 항복.
 */
import { GameEvent, EventPriority } from './event_trigger_registry';

export class CaoCaoSurrenderEvent implements GameEvent {
    public readonly id = 'cao_cao_surrender';
    public readonly name = '조조 항복';
    public readonly type = 'SURRENDER';
    public readonly priority: EventPriority = 'HISTORICAL';
    public readonly once = true;

    public condition(): boolean { return true; }
    public action(): void {
        console.log("조조가 항복했습니다.");
    }
}
