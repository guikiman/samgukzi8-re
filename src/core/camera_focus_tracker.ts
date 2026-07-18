/**
 * [Task 36] 카메라 뷰포커싱 추적용 카메라 타겟 이벤트
 *
 * AI의 턴 진행이나 중요 전투 연산 발생 시 WebGL 카메라가
 * 해당 헥사곤 좌표로 자동 줌인/이동하도록 제어.
 */

import { EventBus } from "./event_bus";
import { HexCoord, CameraFocusPayload } from "./render_queue_types";

export class CameraFocusTracker {
  constructor(private readonly bus: EventBus) {}

  focus(coord: HexCoord, zoom = 1, instant = false): void {
    const payload: CameraFocusPayload = { coord, zoom, instant };
    this.bus.emit("RENDER_QUEUE_PUSH", { type: "CAMERA_FOCUS", payload, timestamp: Date.now() }, "info");
  }
}
