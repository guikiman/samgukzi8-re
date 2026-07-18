/**
 * [Task 39] UI 화면 오버레이 레이어 상태 분리
 *
 * 3D WebGL 공간이 렌더링되는 동안 상부 HTML5 DOM 기반 UI에
 * 현재 진행 중인 연출 상태와 말풍선이 올바른 순서대로 오버레이.
 */

import { EventBus } from "./event_bus";
import { UiOverlayPayload } from "./render_queue_types";

export class UiOverlayStateManager {
  private overlayStack: UiOverlayPayload[] = [];

  constructor(private readonly bus: EventBus) {}

  pushOverlay(type: string, data: unknown): void {
    const payload: UiOverlayPayload = { type, data };
    this.overlayStack.push(payload);
    this.bus.emit("RENDER_QUEUE_PUSH", { type: "UI_OVERLAY", payload, timestamp: Date.now() }, "info");
  }

  popOverlay(): void {
    this.overlayStack.pop();
  }

  getCurrentOverlay(): UiOverlayPayload | null {
    return this.overlayStack.length > 0 ? this.overlayStack[this.overlayStack.length - 1] : null;
  }

  clearOverlays(): void {
    this.overlayStack = [];
  }
}
