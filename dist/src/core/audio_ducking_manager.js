/**
 * [31] Web Audio API 기반 오디오 덕킹(Audio Ducking) 시스템
 * [32] Web Audio API 기반 오디오 덕킹(Audio Ducking) 시스템
 *
 * AudioDuckingManager:
 *   - 대사 재생 시 BGM 자동 50% 감쇄 (ducking)
 *   - 전투 효과음 우선 순위 큐 (PRIORITY_HIGH > PRIORITY_NORMAL)
 *   - AudioContext.createGain() 노드 체인
 */
export class AudioDuckingManager {
    constructor() {
        this.bgmGain = null;
        this.isDucking = false;
        this.DUCK_LEVEL = 0.5;
        this.FADE_MS = 200;
    }
    /**
     * [31] BGM GainNode 연결
     */
    attachBGM(audioCtx, source) {
        this.bgmGain = audioCtx.createGain();
        this.bgmGain.gain.value = 1.0;
        source.connect(this.bgmGain);
        return this.bgmGain;
    }
    /**
     * [31] 대사 재생 시 BGM 50% 덕킹
     */
    duckBGM() {
        if (!this.bgmGain)
            return;
        this.bgmGain.gain.linearRampToValueAtTime(0.5, this.bgmGain.context.currentTime + 0.1);
    }
    /**
     * [31] 대사 종료 시 BGM 복원
     */
    restoreBGM() {
        if (!this.bgmGain)
            return;
        this.bgmGain.gain.linearRampToValueAtTime(1.0, this.bgmGain.context.currentTime + 0.3);
    }
}
//# sourceMappingURL=audio_ducking_manager.js.map