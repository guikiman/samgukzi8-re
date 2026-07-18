/**
 * [E60] WebAudio 컨텍스트 재개 안전장치 — WebAudioContextResumeFailsafe
 *
 * 목적: 사용자 상호작용 전 AudioContext 재개 실패 시
 *       자동 재시도 및 폴백 처리.
 *
 * 핵심 로직:
 *   1. 사용자 제스처 감지 시 AudioContext.resume() 호출
 *   2. 실패 시 1초 간격 최대 5회 재시도
 */
export class WebAudioContextResumeFailsafe {
    constructor() {
        this.ctx = null;
        this.resumed = false;
        this.maxRetries = 5;
        this.retryCount = 0;
    }
    /** AudioContext 등록 */
    registerContext(ctx) {
        this.ctx = ctx;
        this.setupAutoResume();
    }
    /** 자동 재개 설정 */
    setupAutoResume() {
        const tryResume = () => {
            if (this.resumed || !this.ctx)
                return;
            this.resumeWithRetry();
        };
        // 다양한 사용자 제스처 이벤트
        const events = ['click', 'touchstart', 'keydown', 'mousedown'];
        for (const event of events) {
            document.addEventListener(event, tryResume, { once: true });
        }
    }
    /** 재개 시도 (재시도 포함) */
    async resumeWithRetry() {
        if (!this.ctx || this.resumed)
            return this.resumed;
        while (this.retryCount < this.maxRetries) {
            try {
                if (this.ctx.state === 'running') {
                    this.resumed = true;
                    return true;
                }
                await this.ctx.resume();
                if (this.ctx.state === 'running') {
                    this.resumed = true;
                    return true;
                }
            }
            catch {
                // 재시도
            }
            this.retryCount++;
            if (this.retryCount < this.maxRetries) {
                await this.sleep(1000);
            }
        }
        // 최종 실패 — silent fail (게임은 오디오 없이 계속)
        return false;
    }
    /** AudioContext 재개 여부 */
    isResumed() {
        return this.resumed;
    }
    /** 강제 재개 */
    async forceResume() {
        this.retryCount = 0;
        return this.resumeWithRetry();
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
//# sourceMappingURL=web_audio_context_resume_failsafe.js.map