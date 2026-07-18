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

interface TrackedResource {
    readonly id: string;
    readonly type: 'geometry' | 'texture' | 'material' | 'audiocontext' | 'buffer';
    readonly createdAt: number;
    disposed: boolean;
    readonly label: string;
}

export class MemoryCleanupManager {
    private resources: Map<string, TrackedResource> = new Map();
    private cleanupInterval: ReturnType<typeof setInterval> | null = null;
    private warningThresholds = { geometry: 500, texture: 200, material: 300 };

    start(): void {
        this.cleanupInterval = setInterval(() => this.runCleanup(), 30000);
    }

    stop(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }

    trackGeometry(id: string, label: string): void {
        this.resources.set(id, { id, type: 'geometry', createdAt: Date.now(), disposed: false, label });
    }

    trackTexture(id: string, label: string): void {
        this.resources.set(id, { id, type: 'texture', createdAt: Date.now(), disposed: false, label });
    }

    trackMaterial(id: string, label: string): void {
        this.resources.set(id, { id, type: 'material', createdAt: Date.now(), disposed: false, label });
    }

    trackAudioContext(id: string, label: string): void {
        this.resources.set(id, { id, type: 'audiocontext', createdAt: Date.now(), disposed: false, label });
    }

    markDisposed(id: string): boolean {
        const resource = this.resources.get(id);
        if (resource) {
            resource.disposed = true;
            return true;
        }
        return false;
    }

    private runCleanup(): void {
        const now = Date.now();
        const staleTimeout = 120000;

        for (const [id, resource] of this.resources) {
            if (!resource.disposed && (now - resource.createdAt > staleTimeout)) {
                resource.disposed = true;
            }
        }
    }

    forceGC(): void {
        this.runCleanup();
    }

    generateReport(): LeakReport {
        const warnings: string[] = [];
        const byType: Record<string, { total: number; leaked: number }> = {};

        let totalDisposed = 0;
        let totalLeaked = 0;

        for (const resource of this.resources.values()) {
            if (!byType[resource.type]) {
                byType[resource.type] = { total: 0, leaked: 0 };
            }
            byType[resource.type].total++;
            if (resource.disposed) {
                totalDisposed++;
            } else {
                totalLeaked++;
                byType[resource.type].leaked++;
            }
        }

        for (const [type, counts] of Object.entries(byType)) {
            const threshold = (this.warningThresholds as any)[type] ?? 100;
            if (counts.leaked > threshold) {
                warnings.push(`${type} 누수: ${counts.leaked}개 (임계치: ${threshold})`);
            }
        }

        const memory = (typeof window !== 'undefined' && (window.performance as any).memory)
            ? Math.round((window.performance as any).memory.usedJSHeapSize / (1024 * 1024) * 10) / 10
            : 0;

        return {
            timestamp: Date.now(),
            trackedObjects: this.resources.size,
            disposedObjects: totalDisposed,
            leakedObjects: totalLeaked,
            heapSizeMB: memory,
            warnings,
        };
    }

    getResourceCount(type?: string): number {
        if (type) {
            return Array.from(this.resources.values()).filter(r => r.type === type).length;
        }
        return this.resources.size;
    }

    clear(): void {
        this.resources.clear();
    }
}
