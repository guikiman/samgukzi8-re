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
export class AITTSPipeline {
    constructor() {
        this.queue = [];
        this.currentItem = null;
        this.history = [];
        this.speechSynthesis = null;
        this.voiceCache = new Map();
        this._isSpeaking = false;
        this.LANG_VOICE_MAP = {
            'ko-KR': 'ko-KR',
            'zh-CN': 'zh-CN',
            'ja-JP': 'ja-JP',
        };
    }
    get isSpeaking() {
        return this._isSpeaking || (this.speechSynthesis?.speaking ?? false);
    }
    init() {
        if (typeof window === 'undefined' || !window.speechSynthesis) {
            return false;
        }
        this.speechSynthesis = window.speechSynthesis;
        this.cacheVoices();
        return true;
    }
    cacheVoices() {
        const voices = this.speechSynthesis.getVoices();
        for (const voice of voices) {
            for (const lang of Object.values(this.LANG_VOICE_MAP)) {
                if (voice.lang.startsWith(lang)) {
                    if (!this.voiceCache.has(lang)) {
                        this.voiceCache.set(lang, voice);
                    }
                }
            }
        }
    }
    getAvailableVoices() {
        if (!this.speechSynthesis)
            return [];
        return this.speechSynthesis.getVoices();
    }
    speak(text, lang = 'ko-KR', config) {
        if (!this.speechSynthesis)
            return false;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = config?.rate ?? 1.0;
        utterance.pitch = config?.pitch ?? 1.0;
        utterance.volume = config?.volume ?? 1.0;
        const voice = this.voiceCache.get(lang);
        if (voice)
            utterance.voice = voice;
        this.speechSynthesis.speak(utterance);
        return true;
    }
    speakDialogue(dialogue) {
        return this.speak(dialogue.text, dialogue.lang);
    }
    enqueueDialogue(dialogue) {
        this.queue.push({
            dialogue,
            state: 'PENDING',
        });
    }
    processQueue() {
        let processed = 0;
        while (this.queue.length > 0 && !this._isSpeaking) {
            const item = this.queue.shift();
            this.currentItem = item;
            item.state = 'SPEAKING';
            this._isSpeaking = true;
            this.speak(item.dialogue.text, item.dialogue.lang);
            item.state = 'COMPLETED';
            this.history.push(item.dialogue);
            this.currentItem = null;
            this._isSpeaking = false;
            processed++;
        }
        return processed;
    }
    cancelAll() {
        if (this.speechSynthesis) {
            this.speechSynthesis.cancel();
        }
        for (const item of this.queue) {
            item.state = 'CANCELLED';
        }
        this.queue = [];
        this.currentItem = null;
        this._isSpeaking = false;
    }
    pause() {
        if (this.speechSynthesis?.speaking) {
            this.speechSynthesis.pause();
        }
    }
    resume() {
        if (this.speechSynthesis?.paused) {
            this.speechSynthesis.resume();
        }
    }
    getState() {
        return {
            isSpeaking: this.isSpeaking,
            queueLength: this.queue.length,
            currentDialogue: this.currentItem?.dialogue ?? null,
            history: [...this.history],
        };
    }
    clearHistory() {
        this.history = [];
    }
}
//# sourceMappingURL=ai_tts_pipeline.js.map