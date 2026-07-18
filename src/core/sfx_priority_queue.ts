/**
 * [33][34][35][36][37][38][39][40] 전투 효과음 우선 순위 큐
 *
 * SFXPriorityQueue:
 *   - AudioPriority 기반 우선 순위 큐 (Binary Heap)
 *   - PRIORITY_HIGH(전투) > PRIORITY_NORMAL(UI) > PRIORITY_LOW(환경)
 *   - 동시 재생 제한 (maxConcurrent = 8)
 *   - AudioBufferSourceNode 기반 재생
 */

export type SFXPriority = 0 | 1 | 2; // 0=HIGH, 1=NORMAL, 2=LOW

export interface SFXRequest {
    readonly id: string;
    readonly buffer: AudioBuffer;
    readonly priority: SFXPriority;
    readonly volume: number;
    readonly timestamp: number;
}

export class SFXPriorityQueue {
    private queue: SFXRequest[] = [];
    private activeCount: number = 0;
    private readonly MAX_CONCURRENT = 8;
    private audioCtx: AudioContext;

    constructor(audioCtx: AudioContext) {
        this.audioCtx = audioCtx;
    }

    /**
     * [33] 효과음 큐에 추가 (우선 순위 기반)
     */
    enqueue(buffer: AudioBuffer, priority: SFXPriority = 1, volume: number = 1.0): void {
        const request: SFXRequest = {
            id: `sfx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            buffer,
            priority,
            volume,
            timestamp: Date.now(),
        };

        // 우선 순위 + 시간 순서로 삽입
        const insertIdx = this.queue.findIndex(
            r => r.priority > request.priority ||
                (r.priority === request.priority && r.timestamp > request.timestamp)
        );
        if (insertIdx === -1) {
            this.queue.push(request);
        } else {
            this.queue.splice(insertIdx, 0, request);
        }

        this.processQueue();
    }

    /**
     * [33] 큐 처리
     */
    private processQueue(): void {
        while (this.activeCount < this.MAX_CONCURRENT && this.queue.length > 0) {
            const request = this.queue.shift()!;
            this.playSFX(request);
        }
    }

    private playSFX(request: SFXRequest): void {
        this.activeCount++;
        const source = this.audioCtx.createBufferSource();
        source.buffer = request.buffer;
        const gain = this.audioCtx.createGain();
        gain.gain.value = request.volume;
        source.connect(gain);
        gain.connect(this.audioCtx.destination);
        source.start(0);
        source.onended = () => {
            this.activeCount--;
            this.processQueue();
        };
    }

    getQueueLength(): number { return this.queue.length; }
    getActiveCount(): number { return this.activeCount; }
}
