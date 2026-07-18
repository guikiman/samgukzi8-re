/**
 * [12] 연계 책략 이벤트 — ChainStratagemEvent
 * 
 * 목적: 전술 전투 중 연계 책략.
 */
import { GameEvent, EventPriority } from './event_trigger_registry';

export class ChainStratagemEvent implements GameEvent {
    public readonly id = 'chain_stratagem';
    public readonly name = '연계 책략';
    public readonly type = 'STRATAGEM';
    public readonly priority: EventPriority = 'BATTLE';
    public readonly once = false;

    public condition(): boolean { return true; }
    public action(): void {
        console.log("연계 책략 발동: 연환계 + 화계 연쇄.");
    }
}
