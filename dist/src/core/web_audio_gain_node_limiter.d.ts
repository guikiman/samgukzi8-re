/**
 * [E47] WebAudio 음량 리미터 — WebAudioGainNodeLimiter
 *
 * 목적: 전투 효과음/대사가 갑자기 튀어 사용자 이어폰을 보호.
 *
 * 핵심 로직:
 *   1. GainNode 체인으로 최대 음량 하드 리미트
 *   2. 동적 압축(DynamicCompressor)으로 급격한 피크 차단
 */
export declare class WebAudioGainNodeLimiter {
    private ctx;
    private gainNode;
    private compressor;
    private masterGain;
    constructor(ctx: AudioContext);
    /** 소스 노드를 리미터 체인에 연결 */
    connectSource(source: AudioNode): AudioNode;
    /** 마스터 볼륨 설정 (0~1) */
    setMasterVolume(volume: number): void;
    /** 리미터 게인 설정 */
    setLimiterGain(gain: number): void;
    /** 컴프레서 임계값 설정 (dB) */
    setCompressorThreshold(db: number): void;
    /** 바이패스 */
    bypass(): void;
    /** AudioContext 반환 */
    getContext(): AudioContext;
}
//# sourceMappingURL=web_audio_gain_node_limiter.d.ts.map