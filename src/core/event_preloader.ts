/**
 * [20] 조건부 이벤트 프리-로더 — EventPreloader
 *
 * EventPreloader:
 *   1. 다음 턴에 발동할 가능성이 높은 이벤트의 리소스를 백그라운드에서 미리 로드
 *   2. 대사, 무장 그래픽, 연출 배경 등의 에셋을 캐시
 *   3. 로드 완료 콜백을 통해 UI 레이어에 준비 상태 통지
 */

import type { GameEvent, EventTriggerRegistry } from './event_trigger_registry.js';

export interface PreloadCandidate {
    readonly eventId: string;
    readonly eventName: string;
    readonly probability: number;        // 0.0 ~ 1.0
    readonly requiredAssets: string[];   // 로드해야 할 에셋 URL 목록
}

export interface PreloadResult {
    readonly eventId: string;
    readonly success: boolean;
    readonly loadedAssets: string[];
    readonly failedAssets: string[];
    readonly loadTimeMs: number;
}

type PreloadCallback = (result: PreloadResult) => void;

export class EventPreloader {
    private cache: Map<string, PreloadResult> = new Map();
    private activeLoads: Map<string, Promise<PreloadResult>> = new Map();
    private preloadQueue: PreloadCandidate[] = [];
    private isProcessing = false;
    private listeners: Set<PreloadCallback> = new Set();

    onPreloadComplete(callback: PreloadCallback): () => void {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    queueForPreload(candidate: PreloadCandidate): void {
        if (this.cache.has(candidate.eventId)) return;
        this.preloadQueue.push(candidate);
    }

    queueBatch(candidates: PreloadCandidate[]): void {
        for (const c of candidates) this.queueForPreload(c);
    }

    async processQueue(): Promise<void> {
        if (this.isProcessing) return;
        this.isProcessing = true;

        // 확률 높은 순으로 정렬
        this.preloadQueue.sort((a, b) => b.probability - a.probability);
        const batch = this.preloadQueue.splice(0, 10);
        this.isProcessing = false;

        const promises = batch.map(c => this.loadSingle(c));
        const results = await Promise.allSettled(promises);

        for (const result of results) {
            if (result.status === 'fulfilled') {
                this.cache.set(result.value.eventId, result.value);
                for (const cb of this.listeners) cb(result.value);
            }
        }
    }

    private async loadSingle(candidate: PreloadCandidate): Promise<PreloadResult> {
        if (this.activeLoads.has(candidate.eventId)) {
            return this.activeLoads.get(candidate.eventId)!;
        }

        const start = performance.now();
        const loaded: string[] = [];
        const failed: string[] = [];

        const promise = this.performLoad(candidate, loaded, failed, start);
        this.activeLoads.set(candidate.eventId, promise);
        const result = await promise;
        this.activeLoads.delete(candidate.eventId);
        return result;
    }

    private async performLoad(
        candidate: PreloadCandidate,
        loaded: string[],
        failed: string[],
        start: number,
    ): Promise<PreloadResult> {
        for (const asset of candidate.requiredAssets) {
            try {
                if (asset.match(/\.(png|jpg|jpeg|gif|webp)$/i)) {
                    await this.preloadImage(asset);
                } else if (asset.match(/\.(mp3|wav|ogg)$/i)) {
                    await this.preloadAudio(asset);
                } else if (asset.match(/\.json$/i)) {
                    await this.preloadJson(asset);
                }
                loaded.push(asset);
            } catch {
                failed.push(asset);
            }
        }

        return {
            eventId: candidate.eventId,
            success: failed.length === 0,
            loadedAssets: loaded,
            failedAssets: failed,
            loadTimeMs: performance.now() - start,
        };
    }

    private preloadImage(url: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => reject();
            img.src = url;
        });
    }

    private preloadAudio(url: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.preload = 'auto';
            audio.oncanplaythrough = () => resolve();
            audio.onerror = () => reject();
            audio.src = url;
        });
    }

    private async preloadJson(url: string): Promise<void> {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        await response.json();
    }

    getCachedResult(eventId: string): PreloadResult | undefined {
        return this.cache.get(eventId);
    }

    getQueueLength(): number {
        return this.preloadQueue.length;
    }

    clear(): void {
        this.cache.clear();
        this.activeLoads.clear();
        this.preloadQueue = [];
        this.listeners.clear();
    }
}
