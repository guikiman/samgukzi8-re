/**
 * [Task 51 / E57] OffscreenCanvas 렌더러 — OffscreenCanvasRenderer
 *
 * 목적: Web Worker에서 Canvas 렌더링을 수행하여
 *       메인 스레드 부하를 0으로 만듦.
 *
 * 핵심 로직:
 *   1. OffscreenCanvas를 Worker로 전송
 *   2. Worker 내부에서 렌더링 루프 실행
 *   3. Worker 에러 핸들링 및 자동 재시작
 *   4. 프레임 통계 추적
 */
export class OffscreenCanvasRenderer {
    constructor() {
        this.worker = null;
        this.canvas = null;
        this.renderedFrames = 0;
        this.droppedFrames = 0;
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.workerUrl = "";
        this.frameTimes = [];
    }
    /**
     * OffscreenCanvas API 지원 여부 확인
     */
    static isSupported() {
        return typeof OffscreenCanvas !== "undefined" && typeof Worker !== "undefined";
    }
    /** OffscreenCanvas 초기화 */
    async init(canvas, workerUrl) {
        this.workerUrl = workerUrl;
        try {
            this.canvas = canvas.transferControlToOffscreen();
            this.spawnWorker();
        }
        catch (e) {
            console.error("[OffscreenCanvasRenderer] Init failed:", e);
            throw e;
        }
    }
    /** Worker 생성 */
    spawnWorker() {
        this.worker = new Worker(this.workerUrl);
        this.worker.onerror = (e) => {
            console.error("[OffscreenCanvasRenderer] Worker error:", e);
            this.handleWorkerCrash();
        };
        this.worker.onmessageerror = () => {
            console.error("[OffscreenCanvasRenderer] Worker message error");
            this.handleWorkerCrash();
        };
        // 초기 메시지 전송
        this.worker.postMessage({ type: "init", canvas: this.canvas }, [this.canvas]);
    }
    /** Worker 충돌 처리 */
    handleWorkerCrash() {
        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            console.log(`[OffscreenCanvasRenderer] Restarting worker (attempt ${this.retryCount}/${this.maxRetries})`);
            this.spawnWorker();
        }
        else {
            console.error("[OffscreenCanvasRenderer] Max retries reached");
        }
    }
    /** 렌더링 명령 전송 */
    render(data) {
        this.lastFrameTime = performance.now();
        try {
            const frame = { command: "render", data, timestamp: this.lastFrameTime };
            this.worker?.postMessage(frame);
            this.renderedFrames++;
        }
        catch {
            this.droppedFrames++;
        }
    }
    /** Worker 메시지 수신 */
    onMessage(callback) {
        this.worker?.addEventListener("message", (e) => {
            callback(e.data);
        });
    }
    /** 리사이즈 */
    resize(width, height) {
        this.worker?.postMessage({ type: "resize", width, height });
    }
    /** 품질 설정 전송 */
    setQuality(level) {
        this.worker?.postMessage({ type: "setQuality", level });
    }
    /** 렌더링 통계 */
    getStats() {
        return {
            renderedFrames: this.renderedFrames,
            droppedFrames: this.droppedFrames,
            averageFPS: this.calculateFPS(),
        };
    }
    calculateFPS() {
        if (this.frameTimes.length < 2)
            return 0;
        const now = performance.now();
        this.frameTimes.push(now);
        if (this.frameTimes.length > 60)
            this.frameTimes.shift();
        const elapsed = now - this.frameTimes[0];
        return elapsed > 0 ? Math.round((this.frameTimes.length / elapsed) * 1000) : 0;
    }
    /** 정리 */
    destroy() {
        this.worker?.terminate();
        this.worker = null;
        this.canvas = null;
        this.retryCount = 0;
    }
}
//# sourceMappingURL=offscreen_canvas_renderer.js.map