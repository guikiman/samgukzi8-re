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
export type QualityLevel = "ultra" | "high" | "medium" | "low" | "potato";
export declare class AdaptiveLagMonitor {
    private frameTimes;
    private readonly maxSamples;
    private frameCount;
    private _currentQuality;
    private _averageFPS;
    private _isLagging;
    private evaluationCounter;
    private readonly evaluationInterval;
    private manualOverride;
    onQualityDowngrade?: (from: QualityLevel, to: QualityLevel) => void;
    /**
     * 프레임 기록
     */
    recordFrame(dt: number): void;
    /**
     * 평균 FPS
     */
    get averageFPS(): number;
    /**
     * 랙 상태
     */
    get isLagging(): boolean;
    /**
     * 권장 품질 레벨
     */
    get recommendedQualityLevel(): QualityLevel;
    /**
     * 현재 품질 레벨
     */
    get qualityLevel(): QualityLevel;
    /**
     * 품질 레벨 수동 설정
     */
    setQualityLevel(level: QualityLevel): void;
    /**
     * 자동 평가 재개
     */
    reset(): void;
    private evaluate;
}
//# sourceMappingURL=adaptive_lag_monitor.d.ts.map