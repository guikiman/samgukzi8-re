/**
 * [Task 62] 프레임 레이트 캡퍼 — FrameRateCapper
 *
 * 목적: requestAnimationFrame 기반 프레임 레이트 제한 및 모니터링.
 *
 * 핵심 로직:
 *   1. 목표 FPS 기준 프레임 간격 계산
 *   2. 롤링 평균 실제 FPS 측정 (30프레임)
 *   3. 배터리/데스크톱 자동 추천
 */
export class FrameRateCapper {
    constructor(targetFPS = 60) {
        this.frameTimestamps = [];
        this.sampleSize = 30;
        this.lastFrameTime = 0;
        this._targetFPS = targetFPS;
    }
    /**
     * 목표 FPS 설정
     */
    setTargetFPS(fps) {
        this._targetFPS = Math.max(1, Math.min(144, fps));
    }
    /**
     * 현재 목표 FPS
     */
    get targetFPS() {
        return this._targetFPS;
    }
    /**
     * 프레임 렌더링 여부 결정
     */
    shouldRender(timestamp) {
        const interval = 1000 / this._targetFPS;
        if (timestamp - this.lastFrameTime < interval)
            return false;
        this.frameTimestamps.push(timestamp);
        if (this.frameTimestamps.length > this.sampleSize) {
            this.frameTimestamps.shift();
        }
        this.lastFrameTime = timestamp;
        return true;
    }
    /**
     * 실제 FPS (롤링 평균)
     */
    get currentFPS() {
        if (this.frameTimestamps.length < 2)
            return this._targetFPS;
        const elapsed = this.frameTimestamps[this.frameTimestamps.length - 1] - this.frameTimestamps[0];
        const count = this.frameTimestamps.length - 1;
        return elapsed > 0 ? Math.round((count / elapsed) * 1000) : this._targetFPS;
    }
    /**
     * 리셋
     */
    reset() {
        this.frameTimestamps = [];
        this.lastFrameTime = 0;
    }
    /**
     * 플랫폼별 권장 FPS
     */
    static getRecommendedFPS() {
        if (typeof navigator === "undefined")
            return 60;
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        return isMobile ? 30 : 60;
    }
}
//# sourceMappingURL=frame_rate_capper.js.map