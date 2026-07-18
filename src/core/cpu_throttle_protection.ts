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
    readonly throttleLevel: number; // 0=정상, 1=경고, 2=심각
    readonly isThrottled: boolean;
}

export class CPUThrottleProtection {
    private frameTimes: number[] = [];
    private readonly SAMPLE_SIZE = 30;
    private throttleLevel = 0;
    private onThrottleCallbacks: Array<(level: number) => void> = [];

    /** 프레임 시간 기록 (requestAnimationFrame에서 호출) */
    recordFrame(timestamp: number): void {
        this.frameTimes.push(timestamp);
        if (this.frameTimes.length > this.SAMPLE_SIZE) {
            this.frameTimes.shift();
        }
        this.evaluateThrottle();
    }

    /** 현재 FPS 계산 */
    getCurrentFPS(): number {
        if (this.frameTimes.length < 2) return 60;
        const elapsed = this.frameTimes[this.frameTimes.length - 1] - this.frameTimes[0];
        return Math.round(((this.frameTimes.length - 1) / elapsed) * 1000);
    }

    /** 스로틀 상태 평가 */
    private evaluateThrottle(): void {
        const fps = this.getCurrentFPS();
        let newLevel = 0;

        if (fps < 20) {
            newLevel = 2; // 심각
        } else if (fps < 30) {
            newLevel = 1; // 경고
        }

        if (newLevel !== this.throttleLevel) {
            this.throttleLevel = newLevel;
            for (const cb of this.onThrottleCallbacks) {
                try { cb(newLevel); } catch { /* ignore */ }
            }
        }
    }

    /** 스로틀 레벨 변경 콜백 */
    onThrottle(callback: (level: number) => void): void {
        this.onThrottleCallbacks.push(callback);
    }

    /** 현재 스로틀 레벨 */
    getThrottleLevel(): number {
        return this.throttleLevel;
    }

    /** 현재 상태 리포트 */
    getState(): CPUThrottleState {
        return {
            currentFPS: this.getCurrentFPS(),
            throttleLevel: this.throttleLevel,
            isThrottled: this.throttleLevel > 0,
        };
    }

    /** 프레임 데이터 초기화 */
    reset(): void {
        this.frameTimes = [];
        this.throttleLevel = 0;
    }
}
