/**
 * [Task 32] 타일/지형 변경 연출 이벤트 발행기
 *
 * 불화살이나 낙석 등으로 인해 헥사곤 맵 지형 타일이 변경될 때
 * WebGL에 정밀 스트리밍.
 */
import { EventBus } from "./event_bus";
import { HexCoord } from "./render_queue_types";
export declare class TileChangeEmitter {
    private readonly bus;
    constructor(bus: EventBus);
    emitTileChange(coord: HexCoord, newTerrain: string, fx?: string): void;
}
//# sourceMappingURL=tile_change_emitter.d.ts.map