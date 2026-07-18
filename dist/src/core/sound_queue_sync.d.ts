/**
 * [Task 35] 사운드/오디오 오실레이터 재생 큐 동기화
 *
 * WebGL 렌더러와 동기화되어 피격 시 타격음, 성문 파괴음 등
 * 합성 사운드가 지연 없이 실시간 출력되도록 Audio Context 재생 트리거.
 */
import { EventBus } from "./event_bus";
export declare class SoundQueueSync {
    private readonly bus;
    constructor(bus: EventBus);
    playSound(soundId: string, volume?: number, loop?: boolean): void;
}
//# sourceMappingURL=sound_queue_sync.d.ts.map