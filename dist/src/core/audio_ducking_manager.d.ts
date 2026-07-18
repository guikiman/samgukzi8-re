/**
 * [31] Web Audio API 기반 오디오 덕킹(Audio Ducking) 시스템
 * [32] Web Audio API 기반 오디오 덕킹(Audio Ducking) 시스템
 *
 * AudioDuckingManager:
 *   - 대사 재생 시 BGM 자동 50% 감쇄 (ducking)
 *   - 전투 효과음 우선 순위 큐 (PRIORITY_HIGH > PRIORITY_NORMAL)
 *   - AudioContext.createGain() 노드 체인
 */
export type AudioPriority = 'PRIORITY_HIGH' | 'PRIORITY_NORMAL' | 'PRIORITY_LOW';
export interface DuckingConfig {
    readonly duckLevel: number;
    readonly fadeInMs: number;
    readonly fadeOutMs: number;
    readonly priority: AudioPriority;
}
export declare class AudioDuckingManager {
    private bgmGain;
    private isDucking;
    private readonly DUCK_LEVEL;
    private readonly FADE_MS;
    /**
     * [31] BGM GainNode 연결
     */
    attachBGM(audioCtx: AudioContext, source: AudioNode): GainNode;
    /**
     * [31] 대사 재생 시 BGM 50% 덕킹
     */
    duckBGM(): void;
    /**
     * [31] 대사 종료 시 BGM 복원
     */
    restoreBGM(): void;
}
//# sourceMappingURL=audio_ducking_manager.d.ts.map