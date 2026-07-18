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
export class HexTouchHandler {
    constructor() {
        this.touchCount = 0;
        this.lastDist = 0;
        this.lastCenterX = 0;
        this.lastCenterY = 0;
    }
    /**
     * 터치 시작
     */
    onTouchStart(touches) {
        this.touchCount = touches.length;
        if (touches.length === 2) {
            this.lastDist = this.getTouchDist(touches);
        }
    }
    /**
     * 터치 이동
     */
    onTouchMove(touches) {
        if (touches.length === 2) {
            const dist = this.getTouchDist(touches);
            const zoomDelta = this.lastDist - dist;
            this.lastDist = dist;
            return { zoomDelta, panX: 0, panY: 0 };
        }
        return { zoomDelta: 0, panX: 0, panY: 0 };
    }
    getTouchDist(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
//# sourceMappingURL=hex_touch_handler.js.map