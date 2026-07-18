/**
 * [4] 도원결의 이벤트 트리거 — OathOfPeachGardenEvent
 * 
 * 목적: 유비, 관우, 장비의 의형제 결성 및 관계 가중치 고정 이벤트.
 */

import { GameEvent, EventPriority } from './event_trigger_registry';

export class OathOfPeachGardenEvent implements GameEvent {
    public readonly id = 'oath_of_peach_garden';
    public readonly name = '도원결의';
    public readonly type = 'OATH';
    public readonly priority: EventPriority = 'HISTORICAL';
    public readonly once = true;

    public condition(): boolean {
        // 실제 게임 상태 연결 필요 (유비, 관우, 장비 재야 여부 등)
        return true; 
    }

    public action(): void {
        console.log("도원결의 이벤트 발생: 유비, 관우, 장비 의형제 결성");
        // 의형제 관계 등록 로직 수행
    }
}
