/**
 * [8] 반란/도적 출현 이벤트 — RebellionBanditEvent
 * 
 * 목적: 치안 불량 지역 반란.
 */
import { GameEvent, EventPriority } from './event_trigger_registry';

export class RebellionBanditEvent implements GameEvent {
    public readonly id = 'rebellion_bandit';
    public readonly name = '반란/도적 출현';
    public readonly type = 'REBELLION';
    public readonly priority: EventPriority = 'DOMESTIC';
    public readonly once = false;

    public condition(): boolean { return true; }
    public action(): void {
        console.log("반란 발생: 치안 및 자원 피해.");
    }
}
