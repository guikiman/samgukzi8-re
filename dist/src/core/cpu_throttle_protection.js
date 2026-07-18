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
export class CPUThrottleProtection {
    constructor() {
        this.frameTimes = [];
        this.SAMPLE_SIZE = 30;
        this.throttleLevel = 0;
        this.onThrottleCallbacks = [];
    }
    /** 프레임 시간 기록 (requestAnimationFrame에서 호출) */
    recordFrame(timestamp) {
        this.frameTimes.push(timestamp);
        if (this.frameTimes.length > this.SAMPLE_SIZE) {
            this.frameTimes.shift();
        }
        this.evaluateThrottle();
    }
    /** 현재 FPS 계산 */
    getCurrentFPS() {
        if (this.frameTimes.length < 2)
            return 60;
        const elapsed = this.frameTimes[this.frameTimes.length - 1] - this.frameTimes[0];
        return Math.round(((this.frameTimes.length - 1) / elapsed) * 1000);
    }
    /** 스로틀 상태 평가 */
    evaluateThrottle() {
        const fps = this.getCurrentFPS();
        let newLevel = 0;
        if (fps < 20) {
            newLevel = 2; // 심각
        }
        else if (fps < 30) {
            newLevel = 1; // 경고
        }
        if (newLevel !== this.throttleLevel) {
            this.throttleLevel = newLevel;
            for (const cb of this.onThrottleCallbacks) {
                try {
                    cb(newLevel);
                }
                catch { /* ignore */ }
            }
        }
    }
    /** 스로틀 레벨 변경 콜백 */
    onThrottle(callback) {
        this.onThrottleCallbacks.push(callback);
    }
    /** 현재 스로틀 레벨 */
    getThrottleLevel() {
        return this.throttleLevel;
    }
    /** 현재 상태 리포트 */
    getState() {
        return {
            currentFPS: this.getCurrentFPS(),
            throttleLevel: this.throttleLevel,
            isThrottled: this.throttleLevel > 0,
        };
    }
    /** 프레임 데이터 초기화 */
    reset() {
        this.frameTimes = [];
        this.throttleLevel = 0;
    }
}
//# sourceMappingURL=cpu_throttle_protection.js.map