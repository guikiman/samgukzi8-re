/**
 * [Task 33] 부대 이동(Move path) 애니메이션 동기화 시퀀서
 *
 * 연산 결과물로 도출된 경로 좌표 배열을 WebGL 3D 엔진이
 * 인지하여 부드러운 유닛 메시 이동 보간을 하도록 트리거.
 */
export class UnitMoveSequencer {
    constructor(bus) {
        this.bus = bus;
    }
    emitMove(unitId, path, speed = 1) {
        const payload = { unitId, path, speed };
        this.bus.emit("RENDER_QUEUE_PUSH", { type: "UNIT_MOVE", payload, timestamp: Date.now() }, "info");
    }
}
//# sourceMappingURL=unit_move_sequencer.js.map