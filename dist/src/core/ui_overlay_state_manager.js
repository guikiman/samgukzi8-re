/**
 * [Task 39] UI 화면 오버레이 레이어 상태 분리
 *
 * 3D WebGL 공간이 렌더링되는 동안 상부 HTML5 DOM 기반 UI에
 * 현재 진행 중인 연출 상태와 말풍선이 올바른 순서대로 오버레이.
 */
export class UiOverlayStateManager {
    constructor(bus) {
        this.bus = bus;
        this.overlayStack = [];
    }
    pushOverlay(type, data) {
        const payload = { type, data };
        this.overlayStack.push(payload);
        this.bus.emit("RENDER_QUEUE_PUSH", { type: "UI_OVERLAY", payload, timestamp: Date.now() }, "info");
    }
    popOverlay() {
        this.overlayStack.pop();
    }
    getCurrentOverlay() {
        return this.overlayStack.length > 0 ? this.overlayStack[this.overlayStack.length - 1] : null;
    }
    clearOverlays() {
        this.overlayStack = [];
    }
}
//# sourceMappingURL=ui_overlay_state_manager.js.map