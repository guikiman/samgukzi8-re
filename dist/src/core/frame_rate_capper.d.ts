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
export declare class FrameRateCapper {
    private _targetFPS;
    private frameTimestamps;
    private readonly sampleSize;
    private lastFrameTime;
    constructor(targetFPS?: number);
    /**
     * 목표 FPS 설정
     */
    setTargetFPS(fps: number): void;
    /**
     * 현재 목표 FPS
     */
    get targetFPS(): number;
    /**
     * 프레임 렌더링 여부 결정
     */
    shouldRender(timestamp: number): boolean;
    /**
     * 실제 FPS (롤링 평균)
     */
    get currentFPS(): number;
    /**
     * 리셋
     */
    reset(): void;
    /**
     * 플랫폼별 권장 FPS
     */
    static getRecommendedFPS(): number;
}
//# sourceMappingURL=frame_rate_capper.d.ts.map