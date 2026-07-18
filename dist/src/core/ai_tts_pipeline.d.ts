/**
 * [D37] AI TTS 파이프라인 — Text-to-Speech Pipeline
 *
 * TTSEngine:
 *   1. Web Speech API 래퍼 (SpeechSynthesis)
 *   2. 대사 큐 관리 (DialogueQueue)
 *   3. 음성 속도/피치/볼륨 제어
 *   4. 한국어/중국어/일본어 음성 지원
 *   5. 대사 우선순위 및 인터럽트 처리
 */
export interface TTSVoiceConfig {
    readonly rate: number;
    readonly pitch: number;
    readonly volume: number;
}
export interface TTSDialogue {
    readonly id: string;
    readonly text: string;
    readonly speaker: string;
    readonly lang: 'ko-KR' | 'zh-CN' | 'ja-JP';
    readonly priority: number;
    readonly timestamp: number;
}
export type QueueState = 'PENDING' | 'SPEAKING' | 'COMPLETED' | 'CANCELLED';
export interface TTSQueueItem {
    readonly dialogue: TTSDialogue;
    state: QueueState;
}
export interface TTSState {
    readonly isSpeaking: boolean;
    readonly queueLength: number;
    readonly currentDialogue: TTSDialogue | null;
    readonly history: TTSDialogue[];
}
export declare class AITTSPipeline {
    private queue;
    private currentItem;
    private history;
    private speechSynthesis;
    private voiceCache;
    private _isSpeaking;
    private readonly LANG_VOICE_MAP;
    get isSpeaking(): boolean;
    init(): boolean;
    private cacheVoices;
    getAvailableVoices(): SpeechSynthesisVoice[];
    speak(text: string, lang?: 'ko-KR' | 'zh-CN' | 'ja-JP', config?: Partial<TTSVoiceConfig>): boolean;
    speakDialogue(dialogue: TTSDialogue): boolean;
    enqueueDialogue(dialogue: TTSDialogue): void;
    processQueue(): number;
    cancelAll(): void;
    pause(): void;
    resume(): void;
    getState(): TTSState;
    clearHistory(): void;
}
//# sourceMappingURL=ai_tts_pipeline.d.ts.map