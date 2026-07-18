/**
 * [E39] 실시간 프레임 기반 그래픽 타협 조율기 — LODPerformanceMonitor
 *
 * 목적: 저사양 기기/브라우저 성능 저하 시 자동으로 그래픽 옵션 하향 조정.
 *
 * 핵심 로직:
 *   1. 3초 평균 FPS 측정
 *   2. 30FPS 미만 → 그림자 해상도 감쇄 + SMAA/FXAA 비활성화
 */
export type LODLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'ULTRA_LOW';
export interface PerformanceMetrics {
    readonly fps: number;
    readonly averageFps: number;
    readonly jsHeapUsedMB: number;
    readonly lodLevel: LODLevel;
}
export interface GraphicsSettings {
    readonly shadowResolution: number;
    readonly antiAliasing: 'SMAA' | 'FXAA' | 'MSAAx2' | 'NONE';
    readonly textureQuality: 'HIGH' | 'MEDIUM' | 'LOW';
    readonly particleEffects: boolean;
    readonly postProcessing: boolean;
}
export declare class LODPerformanceMonitor {
    private frameTimes;
    private currentLOD;
    /** 매 프레임 호출 */
    recordFrame(timestamp: number): void;
    /** 현재 FPS 및 평균 FPS 계산 */
    getMetrics(): PerformanceMetrics;
    /** LOD 레벨 자동 조정 */
    autoAdjust(): GraphicsSettings;
    /** 현재 그래픽 설정 반환 */
    getCurrentSettings(): GraphicsSettings;
    /** 강제 LOD 설정 */
    forceLOD(level: LODLevel): void;
    private getHeapUsedMB;
}
//# sourceMappingURL=lod_performance_monitor.d.ts.map