/**
 * [E54] CPU 과부하 방지 보호막 — CPUThrottleProtection
 *
 * 목적: 저사양 기기에서 Web Worker 과도한 연산으로
 *       브라우저 프리징 방지.
 *
 * 핵심 로직:
 *   1. 프레임 드롭 감지 시 Worker 연산 자동 스로틀링
 *   2. FPS 기반 동적 우선순위 조정
 */
export interface CPUThrottleState {
    readonly currentFPS: number;
    readonly throttleLevel: number;
    readonly isThrottled: boolean;
}
export declare class CPUThrottleProtection {
    private frameTimes;
    private readonly SAMPLE_SIZE;
    private throttleLevel;
    private onThrottleCallbacks;
    /** 프레임 시간 기록 (requestAnimationFrame에서 호출) */
    recordFrame(timestamp: number): void;
    /** 현재 FPS 계산 */
    getCurrentFPS(): number;
    /** 스로틀 상태 평가 */
    private evaluateThrottle;
    /** 스로틀 레벨 변경 콜백 */
    onThrottle(callback: (level: number) => void): void;
    /** 현재 스로틀 레벨 */
    getThrottleLevel(): number;
    /** 현재 상태 리포트 */
    getState(): CPUThrottleState;
    /** 프레임 데이터 초기화 */
    reset(): void;
}
//# sourceMappingURL=cpu_throttle_protection.d.ts.map