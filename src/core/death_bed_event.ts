/**
 * [20] 임종 및 유서 전달 시나리오 — DeathBedEvent
 * 
 * 목적: 사망 전 유산 전달.
 */
import { GameEvent, EventPriority } from './event_trigger_registry';

export class DeathBedEvent implements GameEvent {
    public readonly id = 'death_bed';
    public readonly name = '임종 및 유서';
    public readonly type = 'DEATH';
    public readonly priority: EventPriority = 'HISTORICAL';
    public readonly once = true;

    public condition(): boolean { return true; }
    public action(): void {
        console.log("임종 이벤트: 가보 및 영구 버프 전수.");
    }
}
