import { describe, it, expect, beforeEach } from 'vitest';
import { AITTSPipeline } from '../src/core/ai_tts_pipeline';

describe('AITTSPipeline', () => {
    let pipeline: AITTSPipeline;

    beforeEach(() => {
        pipeline = new AITTSPipeline();
    });

    it('should fail init when speechSynthesis unavailable', () => {
        expect(pipeline.init()).toBe(false);
    });

    it('should return empty queue state initially', () => {
        const state = pipeline.getState();
        expect(state.queueLength).toBe(0);
        expect(state.isSpeaking).toBe(false);
        expect(state.currentDialogue).toBeNull();
    });

    it('should enqueue dialogue', () => {
        pipeline.enqueueDialogue({
            id: 'd1', text: '안녕하세요', speaker: '유비',
            lang: 'ko-KR', priority: 1, timestamp: Date.now(),
        });
        expect(pipeline.getState().queueLength).toBe(1);
    });

    it('should cancel all dialogues', () => {
        pipeline.enqueueDialogue({
            id: 'd1', text: 'test', speaker: 'tester',
            lang: 'ko-KR', priority: 1, timestamp: Date.now(),
        });
        pipeline.cancelAll();
        expect(pipeline.getState().queueLength).toBe(0);
    });

    it('should clear history', () => {
        pipeline.enqueueDialogue({
            id: 'd1', text: 'test', speaker: 'tester',
            lang: 'ko-KR', priority: 1, timestamp: Date.now(),
        });
        pipeline.clearHistory();
        expect(pipeline.getState().history.length).toBe(0);
    });

    it('should return available voices (empty when no speechSynthesis)', () => {
        const voices = pipeline.getAvailableVoices();
        expect(Array.isArray(voices)).toBe(true);
    });

    it('should handle cancel when not speaking', () => {
        pipeline.cancelAll();
        expect(pipeline.getState().queueLength).toBe(0);
    });

    it('should handle pause/resume gracefully', () => {
        pipeline.pause();
        pipeline.resume();
        expect(pipeline.getState().isSpeaking).toBe(false);
    });

    it('should speak dialogue without speechSynthesis', () => {
        const result = pipeline.speak('test', 'ko-KR');
        expect(result).toBe(false);
    });

    it('should speak dialogue via speakDialogue without speechSynthesis', () => {
        const result = pipeline.speakDialogue({
            id: 'd1', text: 'test', speaker: 'tester',
            lang: 'ko-KR', priority: 1, timestamp: 100,
        });
        expect(result).toBe(false);
    });
});
