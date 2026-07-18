/**
 * [33][34][35][36][37][38][39][40] 전투 효과음 우선 순위 큐
 *
 * SFXPriorityQueue:
 *   - AudioPriority 기반 우선 순위 큐 (Binary Heap)
 *   - PRIORITY_HIGH(전투) > PRIORITY_NORMAL(UI) > PRIORITY_LOW(환경)
 *   - 동시 재생 제한 (maxConcurrent = 8)
 *   - AudioBufferSourceNode 기반 재생
 */
export class SFXPriorityQueue {
    constructor(audioCtx) {
        this.queue = [];
        this.activeCount = 0;
        this.MAX_CONCURRENT = 8;
        this.audioCtx = audioCtx;
    }
    /**
     * [33] 효과음 큐에 추가 (우선 순위 기반)
     */
    enqueue(buffer, priority = 1, volume = 1.0) {
        const request = {
            id: `sfx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            buffer,
            priority,
            volume,
            timestamp: Date.now(),
        };
        // 우선 순위 + 시간 순서로 삽입
        const insertIdx = this.queue.findIndex(r => r.priority > request.priority ||
            (r.priority === request.priority && r.timestamp > request.timestamp));
        if (insertIdx === -1) {
            this.queue.push(request);
        }
        else {
            this.queue.splice(insertIdx, 0, request);
        }
        this.processQueue();
    }
    /**
     * [33] 큐 처리
     */
    processQueue() {
        while (this.activeCount < this.MAX_CONCURRENT && this.queue.length > 0) {
            const request = this.queue.shift();
            this.playSFX(request);
        }
    }
    playSFX(request) {
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
    getQueueLength() { return this.queue.length; }
    getActiveCount() { return this.activeCount; }
}
//# sourceMappingURL=sfx_priority_queue.js.map