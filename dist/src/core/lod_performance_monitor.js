/**
 * [E39] 실시간 프레임 기반 그래픽 타협 조율기 — LODPerformanceMonitor
 *
 * 목적: 저사양 기기/브라우저 성능 저하 시 자동으로 그래픽 옵션 하향 조정.
 *
 * 핵심 로직:
 *   1. 3초 평균 FPS 측정
 *   2. 30FPS 미만 → 그림자 해상도 감쇄 + SMAA/FXAA 비활성화
 */
const LOD_SETTINGS = {
    HIGH: { shadowResolution: 2048, antiAliasing: 'SMAA', textureQuality: 'HIGH', particleEffects: true, postProcessing: true },
    MEDIUM: { shadowResolution: 1024, antiAliasing: 'FXAA', textureQuality: 'MEDIUM', particleEffects: true, postProcessing: true },
    LOW: { shadowResolution: 512, antiAliasing: 'NONE', textureQuality: 'LOW', particleEffects: false, postProcessing: false },
    ULTRA_LOW: { shadowResolution: 256, antiAliasing: 'NONE', textureQuality: 'LOW', particleEffects: false, postProcessing: false },
};
const FPS_HISTORY_SIZE = 90; // 3초 @ 60fps → 180프레임
export class LODPerformanceMonitor {
    constructor() {
        this.frameTimes = [];
        this.currentLOD = 'HIGH';
    }
    /** 매 프레임 호출 */
    recordFrame(timestamp) {
        this.frameTimes.push(timestamp);
        if (this.frameTimes.length > FPS_HISTORY_SIZE) {
            this.frameTimes.shift();
        }
    }
    /** 현재 FPS 및 평균 FPS 계산 */
    getMetrics() {
        // 현재 FPS (최근 10프레임)
        const recent = this.frameTimes.slice(-10);
        const recentFps = recent.length > 1
            ? Math.round(1000 / ((recent[recent.length - 1] - recent[0]) / (recent.length - 1)))
            : 60;
        // 3초 평균 FPS
        const avgFps = this.frameTimes.length > 1
            ? Math.round(1000 / ((this.frameTimes[this.frameTimes.length - 1] - this.frameTimes[0]) / (this.frameTimes.length - 1)))
            : 60;
        return {
            fps: recentFps,
            averageFps: avgFps,
            jsHeapUsedMB: this.getHeapUsedMB(),
            lodLevel: this.currentLOD,
        };
    }
    /** LOD 레벨 자동 조정 */
    autoAdjust() {
        const metrics = this.getMetrics();
        let newLOD = 'HIGH';
        if (metrics.averageFps < 15) {
            newLOD = 'ULTRA_LOW';
        }
        else if (metrics.averageFps < 25) {
            newLOD = 'LOW';
        }
        else if (metrics.averageFps < 40) {
            newLOD = 'MEDIUM';
        }
        if (newLOD !== this.currentLOD) {
            this.currentLOD = newLOD;
        }
        return this.getCurrentSettings();
    }
    /** 현재 그래픽 설정 반환 */
    getCurrentSettings() {
        return { ...LOD_SETTINGS[this.currentLOD] };
    }
    /** 강제 LOD 설정 */
    forceLOD(level) {
        this.currentLOD = level;
    }
    getHeapUsedMB() {
        if (typeof performance !== 'undefined' && performance.memory) {
            return Math.round(performance.memory.usedJSHeapSize / (1024 * 1024));
        }
        return 0;
    }
}
//# sourceMappingURL=lod_performance_monitor.js.map