/**
 * [Task 36] 카메라 뷰포커싱 추적용 카메라 타겟 이벤트
 *
 * AI의 턴 진행이나 중요 전투 연산 발생 시 WebGL 카메라가
 * 해당 헥사곤 좌표로 자동 줌인/이동하도록 제어.
 */
export class CameraFocusTracker {
    constructor(bus) {
        this.bus = bus;
    }
    focus(coord, zoom = 1, instant = false) {
        const payload = { coord, zoom, instant };
        this.bus.emit("RENDER_QUEUE_PUSH", { type: "CAMERA_FOCUS", payload, timestamp: Date.now() }, "info");
    }
}
//# sourceMappingURL=camera_focus_tracker.js.map