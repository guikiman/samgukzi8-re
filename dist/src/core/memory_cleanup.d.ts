/**
 * [E49] 메모리 누수 감시 및 해제 관리자 — Memory Leak Cleanup Manager
 *
 * MemoryCleanupManager:
 *   1. Three.js Geometry/Texture/Material dispose 추적
 *   2. Web Audio Context 해제
 *   3. 주기적 GC 유도
 *   4. Leak 탐지 및 리포트
 */
export interface LeakReport {
    readonly timestamp: number;
    readonly trackedObjects: number;
    readonly disposedObjects: number;
    readonly leakedObjects: number;
    readonly heapSizeMB: number;
    readonly warnings: string[];
}
export declare class MemoryCleanupManager {
    private resources;
    private cleanupInterval;
    private warningThresholds;
    start(): void;
    stop(): void;
    trackGeometry(id: string, label: string): void;
    trackTexture(id: string, label: string): void;
    trackMaterial(id: string, label: string): void;
    trackAudioContext(id: string, label: string): void;
    markDisposed(id: string): boolean;
    private runCleanup;
    forceGC(): void;
    generateReport(): LeakReport;
    getResourceCount(type?: string): number;
    clear(): void;
}
//# sourceMappingURL=memory_cleanup.d.ts.map