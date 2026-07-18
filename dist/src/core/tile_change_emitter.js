/**
 * [Task 32] 타일/지형 변경 연출 이벤트 발행기
 *
 * 불화살이나 낙석 등으로 인해 헥사곤 맵 지형 타일이 변경될 때
 * WebGL에 정밀 스트리밍.
 */
export class TileChangeEmitter {
    constructor(bus) {
        this.bus = bus;
    }
    emitTileChange(coord, newTerrain, fx) {
        const payload = { coord, newTerrain, fx };
        this.bus.emit("RENDER_QUEUE_PUSH", { type: "TILE_CHANGE", payload, timestamp: Date.now() }, "info");
    }
}
//# sourceMappingURL=tile_change_emitter.js.map