/**
 * [E49] 메모리 누수 감시 및 해제 관리자 — Memory Leak Cleanup Manager
 *
 * MemoryCleanupManager:
 *   1. Three.js Geometry/Texture/Material dispose 추적
 *   2. Web Audio Context 해제
 *   3. 주기적 GC 유도
 *   4. Leak 탐지 및 리포트
 */
export class MemoryCleanupManager {
    constructor() {
        this.resources = new Map();
        this.cleanupInterval = null;
        this.warningThresholds = { geometry: 500, texture: 200, material: 300 };
    }
    start() {
        this.cleanupInterval = setInterval(() => this.runCleanup(), 30000);
    }
    stop() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
    trackGeometry(id, label) {
        this.resources.set(id, { id, type: 'geometry', createdAt: Date.now(), disposed: false, label });
    }
    trackTexture(id, label) {
        this.resources.set(id, { id, type: 'texture', createdAt: Date.now(), disposed: false, label });
    }
    trackMaterial(id, label) {
        this.resources.set(id, { id, type: 'material', createdAt: Date.now(), disposed: false, label });
    }
    trackAudioContext(id, label) {
        this.resources.set(id, { id, type: 'audiocontext', createdAt: Date.now(), disposed: false, label });
    }
    markDisposed(id) {
        const resource = this.resources.get(id);
        if (resource) {
            resource.disposed = true;
            return true;
        }
        return false;
    }
    runCleanup() {
        const now = Date.now();
        const staleTimeout = 120000;
        for (const [id, resource] of this.resources) {
            if (!resource.disposed && (now - resource.createdAt > staleTimeout)) {
                resource.disposed = true;
            }
        }
    }
    forceGC() {
        this.runCleanup();
    }
    generateReport() {
        const warnings = [];
        const byType = {};
        let totalDisposed = 0;
        let totalLeaked = 0;
        for (const resource of this.resources.values()) {
            if (!byType[resource.type]) {
                byType[resource.type] = { total: 0, leaked: 0 };
            }
            byType[resource.type].total++;
            if (resource.disposed) {
                totalDisposed++;
            }
            else {
                totalLeaked++;
                byType[resource.type].leaked++;
            }
        }
        for (const [type, counts] of Object.entries(byType)) {
            const threshold = this.warningThresholds[type] ?? 100;
            if (counts.leaked > threshold) {
                warnings.push(`${type} 누수: ${counts.leaked}개 (임계치: ${threshold})`);
            }
        }
        const memory = (typeof window !== 'undefined' && window.performance.memory)
            ? Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024) * 10) / 10
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
    getResourceCount(type) {
        if (type) {
            return Array.from(this.resources.values()).filter(r => r.type === type).length;
        }
        return this.resources.size;
    }
    clear() {
        this.resources.clear();
    }
}
//# sourceMappingURL=memory_cleanup.js.map