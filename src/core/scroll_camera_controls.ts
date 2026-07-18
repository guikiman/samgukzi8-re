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

export class ElasticScrollController {
    private velocityX: number = 0;
    private velocityY: number = 0;
    private positionX: number = 0;
    private positionY: number = 0;
    private readonly DAMPING = 0.95;
    private readonly BOUNCE_FORCE = 0.3;
    private minX: number = 0;
    private maxX: number = 1000;
    private minY: number = 0;
    private maxY: number = 1000;

    setBounds(minX: number, maxX: number, minY: number, maxY: number): void {
        this.minX = minX; this.maxX = maxX;
        this.minY = minY; this.maxY = maxY;
    }

    /**
     * [24] 드래그 해제 시 가속도 저장
     */
    applyDragRelease(vx: number, vy: number): void {
        this.velocityX = vx;
        this.velocityY = vy;
    }

    /**
     * [24] 매 프레임 마찰 감쇄 연산
     * V_new = V × d
     */
    update(): ScrollState {
        this.velocityX *= this.DAMPING;
        this.velocityY *= this.DAMPING;
        this.positionX += this.velocityX;
        this.positionY += this.velocityY;

        // 경계 도달 시 바운싱
        if (this.positionX < this.minX) {
            this.positionX = this.minX;
            this.velocityX = Math.abs(this.velocityX) * this.BOUNCE_FORCE;
        }
        if (this.positionX > this.maxX) {
            this.positionX = this.maxX;
            this.velocityX = -Math.abs(this.velocityX) * this.BOUNCE_FORCE;
        }
        if (this.positionY < this.minY) {
            this.positionY = this.minY;
            this.velocityY = Math.abs(this.velocityY) * this.BOUNCE_FORCE;
        }
        if (this.positionY > this.maxY) {
            this.positionY = this.maxY;
            this.velocityY = -Math.abs(this.velocityY) * this.BOUNCE_FORCE;
        }

        return {
            velocityX: this.velocityX,
            velocityY: this.velocityY,
            positionX: this.positionX,
            positionY: this.positionY,
            isScrolling: Math.abs(this.velocityX) > 0.1 || Math.abs(this.velocityY) > 0.1,
        };
    }

    getPosition(): { x: number; y: number } { return { x: this.positionX, y: this.positionY }; }
}

/**
 * [25] Cubic Bezier 카메라 포커스 트래커
 */
export class BezierCameraTracker {
    private startX: number = 0;
    private startY: number = 0;
    private targetX: number = 0;
    private targetY: number = 0;
    private elapsed: number = 0;
    private duration: number = 1000;
    private isAnimating: boolean = false;

    startMove(fromX: number, fromY: number, toX: number, toY: number, durationMs: number = 1000): void {
        this.startX = fromX; this.startY = fromY;
        this.targetX = toX; this.targetY = toY;
        this.elapsed = 0;
        this.duration = durationMs;
        this.isAnimating = true;
    }

    /**
     * [25] Cubic Bezier 보간
     * B(t) = (1-t)³·P0 + 3(1-t)²·t·P1 + 3(1-t)·t²·P2 + t³·P3
     */
    update(deltaMs: number): { x: number; y: number; done: boolean } {
        if (!this.isAnimating) {
            return { x: this.targetX, y: this.targetY, done: true };
        }

        this.elapsed += deltaMs;
        const t = Math.min(1, this.elapsed / this.duration);
        const t3 = t * t * t;
        const t2 = t * t;

        // Cubic Bezier: P0=start, P1=start+(diff*0.3), P2=target-(diff*0.3), P3=target
        const diffX = this.targetX - this.startX;
        const diffY = this.targetY - this.startY;

        const p1x = this.startX + diffX * 0.25;
        const p2x = this.targetX - diffX * 0.25;
        const p1y = this.startY + diffY * 0.25;
        const p2y = this.targetY - diffY * 0.25;

        const x = (1 - t3) * this.startX + 3 * (1 - t2) * t * p1x + 3 * (1 - t) * t2 * p2x + t3 * this.targetX;
        const y = (1 - t3) * this.startY + 3 * (1 - t2) * t * p1y + 3 * (1 - t) * t2 * p2y + t3 * this.targetY;

        if (t >= 1) this.isAnimating = false;

        return { x: Math.round(x), y: Math.round(y), done: !this.isAnimating };
    }
}
