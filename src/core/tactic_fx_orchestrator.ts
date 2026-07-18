/**
 * [Task 34] 전법 전용 시각 이펙트(FX) 오케스트레이션
 *
 * 전법 발동 시 입자 효과, 불덩어리, 성벽 파손 등
 * 리소스 연출 대기 시간을 시뮬레이션 속도와 동기화.
 */

import { EventBus } from "./event_bus";
import { HexCoord, TacticFxPayload } from "./render_queue_types";

export class TacticFxOrchestrator {
  constructor(private readonly bus: EventBus) {}

  emitFx(name: string, origin: HexCoord, target: HexCoord, duration = 1000): void {
    const payload: TacticFxPayload = { name, origin, target, duration };
    this.bus.emit("RENDER_QUEUE_PUSH", { type: "TACTIC_FX", payload, timestamp: Date.now() }, "info");
  }
}
