/**
 * [20] 조건부 이벤트 프리-로더 — EventPreloader
 *
 * EventPreloader:
 *   1. 다음 턴에 발동할 가능성이 높은 이벤트의 리소스를 백그라운드에서 미리 로드
 *   2. 대사, 무장 그래픽, 연출 배경 등의 에셋을 캐시
 *   3. 로드 완료 콜백을 통해 UI 레이어에 준비 상태 통지
 */
export interface PreloadCandidate {
    readonly eventId: string;
    readonly eventName: string;
    readonly probability: number;
    readonly requiredAssets: string[];
}
export interface PreloadResult {
    readonly eventId: string;
    readonly success: boolean;
    readonly loadedAssets: string[];
    readonly failedAssets: string[];
    readonly loadTimeMs: number;
}
type PreloadCallback = (result: PreloadResult) => void;
export declare class EventPreloader {
    private cache;
    private activeLoads;
    private preloadQueue;
    private isProcessing;
    private listeners;
    onPreloadComplete(callback: PreloadCallback): () => void;
    queueForPreload(candidate: PreloadCandidate): void;
    queueBatch(candidates: PreloadCandidate[]): void;
    processQueue(): Promise<void>;
    private loadSingle;
    private performLoad;
    private preloadImage;
    private preloadAudio;
    private preloadJson;
    getCachedResult(eventId: string): PreloadResult | undefined;
    getQueueLength(): number;
    clear(): void;
}
export {};
//# sourceMappingURL=event_preloader.d.ts.map