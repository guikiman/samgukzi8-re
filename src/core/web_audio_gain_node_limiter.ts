/**
 * [E47] WebAudio 음량 리미터 — WebAudioGainNodeLimiter
 *
 * 목적: 전투 효과음/대사가 갑자기 튀어 사용자 이어폰을 보호.
 *
 * 핵심 로직:
 *   1. GainNode 체인으로 최대 음량 하드 리미트
 *   2. 동적 압축(DynamicCompressor)으로 급격한 피크 차단
 */

export class WebAudioGainNodeLimiter {
    private ctx: AudioContext;
    private gainNode: GainNode;
    private compressor: DynamicsCompressorNode;
    private masterGain: GainNode;

    constructor(ctx: AudioContext) {
        this.ctx = ctx;

        // 마스터 게인
        this.masterGain = ctx.createGain();
        this.masterGain.gain.value = 0.8;

        // 다이나믹 컴프레서
        this.compressor = ctx.createDynamicsCompressor();
        this.compressor.threshold.value = -24;
        this.compressor.knee.value = 30;
        this.compressor.ratio.value = 12;
        this.compressor.attack.value = 0.003;
        this.compressor.release.value = 0.25;

        // 리미터 게인
        this.gainNode = ctx.createGain();
        this.gainNode.gain.value = 0.9;

        // 체인: compressor → gainNode → masterGain → destination
        this.compressor.connect(this.gainNode);
        this.gainNode.connect(this.masterGain);
        this.masterGain.connect(ctx.destination);
    }

    /** 소스 노드를 리미터 체인에 연결 */
    connectSource(source: AudioNode): AudioNode {
        source.connect(this.compressor);
        return this.masterGain;
    }

    /** 마스터 볼륨 설정 (0~1) */
    setMasterVolume(volume: number): void {
        this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }

    /** 리미터 게인 설정 */
    setLimiterGain(gain: number): void {
        this.gainNode.gain.value = Math.max(0, Math.min(1, gain));
    }

    /** 컴프레서 임계값 설정 (dB) */
    setCompressorThreshold(db: number): void {
        this.compressor.threshold.value = db;
    }

    /** 바이패스 */
    bypass(): void {
        this.gainNode.gain.value = 1.0;
        this.compressor.threshold.value = 0;
    }

    /** AudioContext 반환 */
    getContext(): AudioContext {
        return this.ctx;
    }
}
