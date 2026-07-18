/**
 * [Task 37] 플로팅 텍스트(Floating Text) 및 연출 전송기
 *
 * 피격 수치("-1450"), 전법명("돌격!"), 무장 컷인 일러스트
 * 메타 데이터를 패키징하여 렌더 큐에 전달.
 */

import { EventBus } from "./event_bus";
import { HexCoord, FloatingTextPayload } from "./render_queue_types";

export class FloatingTextTransmitter {
  constructor(private readonly bus: EventBus) {}

  emit(text: string, coord: HexCoord, color = "#ff4444", duration = 1500): void {
    const payload: FloatingTextPayload = { text, coord, color, duration };
    this.bus.emit("RENDER_QUEUE_PUSH", { type: "FLOATING_TEXT", payload, timestamp: Date.now() }, "info");
  }
}
