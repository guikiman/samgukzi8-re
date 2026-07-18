/**
 * [Task 37] 플로팅 텍스트(Floating Text) 및 연출 전송기
 *
 * 피격 수치("-1450"), 전법명("돌격!"), 무장 컷인 일러스트
 * 메타 데이터를 패키징하여 렌더 큐에 전달.
 */
export class FloatingTextTransmitter {
    constructor(bus) {
        this.bus = bus;
    }
    emit(text, coord, color = "#ff4444", duration = 1500) {
        const payload = { text, coord, color, duration };
        this.bus.emit("RENDER_QUEUE_PUSH", { type: "FLOATING_TEXT", payload, timestamp: Date.now() }, "info");
    }
}
//# sourceMappingURL=floating_text_transmitter.js.map