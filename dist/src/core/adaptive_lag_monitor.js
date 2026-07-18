/**
 * [Task 59] 적응형 랙 모니터 — AdaptiveLagMonitor
 *
 * 목적: 프레임 레이트를 모니터링하고 품질 수준 자동 조정 제안.
 *
 * 핵심 로직:
 *   1. 60프레임 롤링 평균 FPS 계산
 *   2. FPS 임계값 기반 품질 레벨 자동 제안
 *   3. 30프레임마다 평가 (진동 방지)
 */
const FPS_THRESHOLDS = {
    ultra: 55,
    high: 45,
    medium: 30,
    low: 20,
    potato: 0,
};
const QUALITY_ORDER = ["ultra", "high", "medium", "low", "potato"];
export class AdaptiveLagMonitor {
    constructor() {
        this.frameTimes = [];
        this.maxSamples = 60;
        this.frameCount = 0;
        this._currentQuality = "ultra";
        this._averageFPS = 60;
        this._isLagging = false;
        this.evaluationCounter = 0;
        this.evaluationInterval = 30;
        this.manualOverride = false;
    }
    /**
     * 프레임 기록
     */
    recordFrame(dt) {
        this.frameTimes.push(dt);
        if (this.frameTimes.length > this.maxSamples) {
            this.frameTimes.shift();
        }
        this.frameCount++;
        this.evaluationCounter++;
        // 주기적 평가
        if (this.evaluationCounter >= this.evaluationInterval && !this.manualOverride) {
            this.evaluationCounter = 0;
            this.evaluate();
        }
    }
    /**
     * 평균 FPS
     */
    get averageFPS() {
        if (this.frameTimes.length === 0)
            return 60;
        const sum = this.frameTimes.reduce((a, b) => a + b, 0);
        const avgDt = sum / this.frameTimes.length;
        return avgDt > 0 ? Math.round(1000 / avgDt) : 60;
    }
    /**
     * 랙 상태
     */
    get isLagging() {
        return this._isLagging;
    }
    /**
     * 권장 품질 레벨
     */
    get recommendedQualityLevel() {
        const fps = this.averageFPS;
        if (fps >= 55)
            return "ultra";
        if (fps >= 45)
            return "high";
        if (fps >= 30)
            return "medium";
        if (fps >= 20)
            return "low";
        return "potato";
    }
    /**
     * 현재 품질 레벨
     */
    get qualityLevel() {
        return this._currentQuality;
    }
    /**
     * 품질 레벨 수동 설정
     */
    setQualityLevel(level) {
        this.manualOverride = true;
        this._currentQuality = level;
        this._isLagging = level === "potato";
    }
    /**
     * 자동 평가 재개
     */
    reset() {
        this.frameTimes = [];
        this.frameCount = 0;
        this.evaluationCounter = 0;
        this.manualOverride = false;
        this._currentQuality = "ultra";
        this._averageFPS = 60;
        this._isLagging = false;
    }
    evaluate() {
        const fps = this.averageFPS;
        this._averageFPS = fps;
        const recommended = this.recommendedQualityLevel;
        const currentIdx = QUALITY_ORDER.indexOf(this._currentQuality);
        const recommendedIdx = QUALITY_ORDER.indexOf(recommended);
        if (recommendedIdx > currentIdx) {
            const oldLevel = this._currentQuality;
            this._currentQuality = recommended;
            this._isLagging = recommendedIdx >= 3;
            this.onQualityDowngrade?.(oldLevel, recommended);
        }
        else if (recommendedIdx < currentIdx && !this._isLagging) {
            // 성능 회복 시 한 단계�만 복원 (진동 방지)
            const upgradeLevel = QUALITY_ORDER[Math.max(0, currentIdx - 1)];
            this._currentQuality = upgradeLevel;
        }
    }
}
//# sourceMappingURL=adaptive_lag_monitor.js.map