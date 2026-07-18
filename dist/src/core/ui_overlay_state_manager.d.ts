/**
 * [Task 39] UI 화면 오버레이 레이어 상태 분리
 *
 * 3D WebGL 공간이 렌더링되는 동안 상부 HTML5 DOM 기반 UI에
 * 현재 진행 중인 연출 상태와 말풍선이 올바른 순서대로 오버레이.
 */
import { EventBus } from "./event_bus";
import { UiOverlayPayload } from "./render_queue_types";
export declare class UiOverlayStateManager {
    private readonly bus;
    private overlayStack;
    constructor(bus: EventBus);
    pushOverlay(type: string, data: unknown): void;
    popOverlay(): void;
    getCurrentOverlay(): UiOverlayPayload | null;
    clearOverlays(): void;
}
//# sourceMappingURL=ui_overlay_state_manager.d.ts.map