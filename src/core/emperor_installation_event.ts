/**
 * [14] 황제 옹립 이벤트 — EmperorInstallationEvent
 * 
 * 목적: 황제 옹립 후 천하 선포.
 */
import { GameEvent, EventPriority } from './event_trigger_registry';

export class EmperorInstallationEvent implements GameEvent {
    public readonly id = 'emperor_installation';
    public readonly name = '황제 옹립';
    public readonly type = 'EMPEROR';
    public readonly priority: EventPriority = 'HISTORICAL';
    public readonly once = true;

    public condition(): boolean { return true; }
    public action(): void {
        console.log("황제 옹립: 위엄 +300, 타 세력 반감.");
    }
}
