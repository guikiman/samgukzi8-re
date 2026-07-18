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
export interface FrameData {
    readonly command: "render" | "resize" | "clear";
    readonly data?: unknown;
    readonly timestamp: number;
}
export declare class OffscreenCanvasRenderer {
    private worker;
    private canvas;
    private renderedFrames;
    private droppedFrames;
    private lastFrameTime;
    private frameCount;
    private retryCount;
    private readonly maxRetries;
    private workerUrl;
    private frameTimes;
    /**
     * OffscreenCanvas API 지원 여부 확인
     */
    static isSupported(): boolean;
    /** OffscreenCanvas 초기화 */
    init(canvas: HTMLCanvasElement, workerUrl: string): Promise<void>;
    /** Worker 생성 */
    private spawnWorker;
    /** Worker 충돌 처리 */
    private handleWorkerCrash;
    /** 렌더링 명령 전송 */
    render(data: unknown): void;
    /** Worker 메시지 수신 */
    onMessage(callback: (data: unknown) => void): void;
    /** 리사이즈 */
    resize(width: number, height: number): void;
    /** 품질 설정 전송 */
    setQuality(level: "low" | "medium" | "high"): void;
    /** 렌더링 통계 */
    getStats(): {
        renderedFrames: number;
        droppedFrames: number;
        averageFPS: number;
    };
    private calculateFPS;
    /** 정리 */
    destroy(): void;
}
//# sourceMappingURL=offscreen_canvas_renderer.d.ts.map