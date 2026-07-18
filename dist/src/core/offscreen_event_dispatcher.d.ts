/**
 * [Task 60] 오프스크린 이벤트 디스패처 — OffscreenEventDispatcher
 *
 * 목적: OffscreenCanvas 환경에서 마우스/터치 이벤트를
 *       헥사곤 좌표로 변환하여 디스패치.
 *
 * 핵심 로직:
 *   1. 화면 좌표 → 헥사곤 좌표 변환 (flat-top)
 *   2. 마우스/터치 이벤트 리스너 관리
 *   3. 카메라 상태 기반 월드 좌표 계산
 */
export type OffscreenEventType = "hexClick" | "hexHover" | "hexDragStart" | "hexDragEnd" | "rightClick" | "pinch" | "pan";
export interface CameraState {
    readonly x: number;
    readonly y: number;
    readonly zoom: number;
    readonly rotation: number;
}
export interface OffscreenGameEvent {
    readonly type: OffscreenEventType;
    readonly hexQ: number;
    readonly hexR: number;
    readonly screenX: number;
    readonly screenY: number;
    readonly button: number;
    readonly ctrlKey: boolean;
    readonly shiftKey: boolean;
}
export type OffscreenEventHandler = (event: OffscreenGameEvent) => void;
export declare class OffscreenEventDispatcher {
    private canvas;
    private handlers;
    private camera;
    private isDragging;
    private lastPointerX;
    private lastPointerY;
    private boundHandlers;
    /**
     * 캔버스에 이벤트 리스너 연결
     */
    attach(canvas: HTMLCanvasElement): void;
    /**
     * 이벤트 리스너 분리
     */
    detach(): void;
    /**
     * 이벤트 핸들러 등록
     */
    on(type: OffscreenEventType, handler: OffscreenEventHandler): void;
    /**
     * 이벤트 핸들러 제거
     */
    off(type: OffscreenEventType, handler: OffscreenEventHandler): void;
    /**
     * 카메라 상태 업데이트
     */
    updateCamera(camera: CameraState): void;
    /**
     * 화면 좌표 → 헥스 좌표 (flat-top)
     */
    getHexCoord(clientX: number, clientY: number, camera: CameraState): {
        q: number;
        r: number;
    } | null;
    /**
     * 화면 좌표 → 월드 좌표
     */
    getWorldCoord(clientX: number, clientY: number, camera: CameraState): {
        x: number;
        y: number;
    } | null;
    private emit;
    private handleClick;
    private handleMouseMove;
    private handleMouseDown;
    private handleMouseUp;
    private handleContextMenu;
    private handleTouchStart;
    private handleTouchMove;
    private handleTouchEnd;
}
//# sourceMappingURL=offscreen_event_dispatcher.d.ts.map