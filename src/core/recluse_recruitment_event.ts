/**
 * [12] 재야 무장 방문 및 등용 권유 — RecluseRecruitmentEvent
 * 
 * 목적: 재야 무장 방문 및 등용 이벤트.
 */
import { GameEvent, EventPriority } from './event_trigger_registry';

export class RecluseRecruitmentEvent implements GameEvent {
    public readonly id = 'recluse_recruitment';
    public readonly name = '재야 무장 등용';
    public readonly type = 'RECRUITMENT';
    public readonly priority: EventPriority = 'DOMESTIC';
    public readonly once = false;

    public condition(): boolean { return true; }
    public action(): void {
        console.log("재야 무장 방문: 등용 제안 이벤트 발생.");
    }
}
