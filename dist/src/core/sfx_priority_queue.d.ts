/**
 * [33][34][35][36][37][38][39][40] 전투 효과음 우선 순위 큐
 *
 * SFXPriorityQueue:
 *   - AudioPriority 기반 우선 순위 큐 (Binary Heap)
 *   - PRIORITY_HIGH(전투) > PRIORITY_NORMAL(UI) > PRIORITY_LOW(환경)
 *   - 동시 재생 제한 (maxConcurrent = 8)
 *   - AudioBufferSourceNode 기반 재생
 */
export type SFXPriority = 0 | 1 | 2;
export interface SFXRequest {
    readonly id: string;
    readonly buffer: AudioBuffer;
    readonly priority: SFXPriority;
    readonly volume: number;
    readonly timestamp: number;
}
export declare class SFXPriorityQueue {
    private queue;
    private activeCount;
    private readonly MAX_CONCURRENT;
    private audioCtx;
    constructor(audioCtx: AudioContext);
    /**
     * [33] 효과음 큐에 추가 (우선 순위 기반)
     */
    enqueue(buffer: AudioBuffer, priority?: SFXPriority, volume?: number): void;
    /**
     * [33] 큐 처리
     */
    private processQueue;
    private playSFX;
    getQueueLength(): number;
    getActiveCount(): number;
}
//# sourceMappingURL=sfx_priority_queue.d.ts.map