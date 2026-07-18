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
export declare class WebAudioContextResumeFailsafe {
    private ctx;
    private resumed;
    private maxRetries;
    private retryCount;
    /** AudioContext 등록 */
    registerContext(ctx: AudioContext): void;
    /** 자동 재개 설정 */
    private setupAutoResume;
    /** 재개 시도 (재시도 포함) */
    resumeWithRetry(): Promise<boolean>;
    /** AudioContext 재개 여부 */
    isResumed(): boolean;
    /** 강제 재개 */
    forceResume(): Promise<boolean>;
    private sleep;
}
//# sourceMappingURL=web_audio_context_resume_failsafe.d.ts.map