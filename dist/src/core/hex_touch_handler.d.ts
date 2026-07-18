/**
 * [Task 97] 헥스 터치 핸들러 — HexTouchHandler
 *
 * 목적: 터치 디바이스에서 헥스 맵 조작을 위한
 *       멀티터치 제스처 처리.
 *
 * 핵심 로직:
 *   1. 핀치 줌 (두 손가락)
 *   2. 터치 드래그 스크롤
 *   3. 탭으로 타일 선택
 */
export interface TouchState {
    readonly screenX: number;
    readonly screenY: number;
    readonly q: number;
    readonly r: number;
}
export declare class HexTouchHandler {
    private touchCount;
    private lastDist;
    private lastCenterX;
    private lastCenterY;
    /**
     * 터치 시작
     */
    onTouchStart(touches: TouchList): void;
    /**
     * 터치 이동
     */
    onTouchMove(touches: TouchList): {
        zoomDelta: number;
        panX: number;
        panY: number;
    };
    private getTouchDist;
}
//# sourceMappingURL=hex_touch_handler.d.ts.map