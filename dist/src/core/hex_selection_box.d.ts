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
export declare class HexSelectionBox {
    private startX;
    private startY;
    private endX;
    private endY;
    private active;
    /**
     * 선택 시작
     */
    start(x: number, y: number): void;
    /**
     * 선택 업데이트
     */
    update(x: number, y: number): void;
    /**
     * 선택 종료
     */
    end(): void;
    /**
     * 선택 영역 사각형 반환
     */
    getRect(): {
        x: number;
        y: number;
        w: number;
        h: number;
    };
    get isActive(): boolean;
}
//# sourceMappingURL=hex_selection_box.d.ts.map