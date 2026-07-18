/**
 * [24] 엘라스틱 스크롤 마모 감쇄 드래그 기동 제어기
 * [25] 이벤트 연계 베지에(Bezier) 카메라 포커스 트래커
 *
 * ElasticScrollController:
 *   - V_new = V × d (감쇄 계수 d=0.95)
 *   - 맵 경계선 도달 시 역벡터 반발력 (바운싱)
 *
 * BezierCameraTracker:
 *   - Cubic Bezier 보간으로 카메라 부드러운 이동
 */
export interface ScrollState {
    readonly velocityX: number;
    readonly velocityY: number;
    readonly positionX: number;
    readonly positionY: number;
    readonly isScrolling: boolean;
}
export declare class ElasticScrollController {
    private velocityX;
    private velocityY;
    private positionX;
    private positionY;
    private readonly DAMPING;
    private readonly BOUNCE_FORCE;
    private minX;
    private maxX;
    private minY;
    private maxY;
    setBounds(minX: number, maxX: number, minY: number, maxY: number): void;
    /**
     * [24] 드래그 해제 시 가속도 저장
     */
    applyDragRelease(vx: number, vy: number): void;
    /**
     * [24] 매 프레임 마찰 감쇄 연산
     * V_new = V × d
     */
    update(): ScrollState;
    getPosition(): {
        x: number;
        y: number;
    };
}
/**
 * [25] Cubic Bezier 카메라 포커스 트래커
 */
export declare class BezierCameraTracker {
    private startX;
    private startY;
    private targetX;
    private targetY;
    private elapsed;
    private duration;
    private isAnimating;
    startMove(fromX: number, fromY: number, toX: number, toY: number, durationMs?: number): void;
    /**
     * [25] Cubic Bezier 보간
     * B(t) = (1-t)³·P0 + 3(1-t)²·t·P1 + 3(1-t)·t²·P2 + t³·P3
     */
    update(deltaMs: number): {
        x: number;
        y: number;
        done: boolean;
    };
}
//# sourceMappingURL=scroll_camera_controls.d.ts.map