/**
 * [Task 33] 부대 이동(Move path) 애니메이션 동기화 시퀀서
 *
 * 연산 결과물로 도출된 경로 좌표 배열을 WebGL 3D 엔진이
 * 인지하여 부드러운 유닛 메시 이동 보간을 하도록 트리거.
 */
import { EventBus } from "./event_bus";
import { HexCoord } from "./render_queue_types";
export declare class UnitMoveSequencer {
    private readonly bus;
    constructor(bus: EventBus);
    emitMove(unitId: string, path: HexCoord[], speed?: number): void;
}
//# sourceMappingURL=unit_move_sequencer.d.ts.map