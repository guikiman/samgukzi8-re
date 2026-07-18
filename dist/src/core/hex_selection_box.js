/**
 * [Task 95] 헥스 선택 박스 — HexSelectionBox
 *
 * 목적: 헥스 맵 위에 드래그 선택 박스를
 *       그려 다중 타일 선택 지원.
 *
 * 핵심 로직:
 *   1. 드래그로 선택 영역 사각형 표시
 *   2. 선택 영역 내 타일 좌표 계산
 */
export class HexSelectionBox {
    constructor() {
        this.startX = 0;
        this.startY = 0;
        this.endX = 0;
        this.endY = 0;
        this.active = false;
    }
    /**
     * 선택 시작
     */
    start(x, y) {
        this.startX = x;
        this.startY = y;
        this.endX = x;
        this.endY = y;
        this.active = true;
    }
    /**
     * 선택 업데이트
     */
    update(x, y) {
        this.endX = x;
        this.endY = y;
    }
    /**
     * 선택 종료
     */
    end() {
        this.active = false;
    }
    /**
     * 선택 영역 사각형 반환
     */
    getRect() {
        return {
            x: Math.min(this.startX, this.endX),
            y: Math.min(this.startY, this.endY),
            w: Math.abs(this.endX - this.startX),
            h: Math.abs(this.endY - this.startY),
        };
    }
    get isActive() {
        return this.active;
    }
}
//# sourceMappingURL=hex_selection_box.js.map