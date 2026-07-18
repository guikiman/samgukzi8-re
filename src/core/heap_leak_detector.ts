/**
 * [E40] 메모리 해제 누수 자동 감시 장치 — HeapLeakDetector
 *
 * 목적: 장시간 플레이 시 퇴각 부대/전환 화면이 RAM에 상주하여
 *       브라우저 OOM 발생을 원천 차단.
 *
 * 핵심 로직:
 *   1. Scene 제거 시 allocated된 모든 3D 리소스 dispose() 체인 호출
 *   2. 누수 탐지 시 리포트
 */

export interface TrackedResource {
    readonly type: 'GEOMETRY' | 'TEXTURE' | 'MATERIAL' | 'AUDIO_BUFFER';
    readonly id: string;
    readonly createdAt: number;
    disposed: boolean;
}

export interface LeakReport {
    readonly totalTracked: number;
    readonly leakedCount: number;
    readonly leakedResources: TrackedResource[];
    readonly heapSizeMB: number;
    readonly timestamp: number;
}

interface Disposable {
    dispose(): void;
}

export class HeapLeakDetector {
    private resources: Map<string, TrackedResource> = new Map();
    private disposables: Map<string, Disposable> = new Map();
    private readonly CHECK_INTERVAL_MS = 30000; // 30초

    /** 리소스 등록 */
    register(id: string, type: TrackedResource['type'], disposable?: Disposable): void {
        this.resources.set(id, {
            type,
            id,
            createdAt: Date.now(),
            disposed: false,
        });
        if (disposable) {
            this.disposables.set(id, disposable);
        }
    }

    /** 리소스 해제 */
    dispose(id: string): boolean {
        const resource = this.resources.get(id);
        if (!resource || resource.disposed) return false;

        resource.disposed = true;

        // dispose() 호출 체인
        const disposable = this.disposables.get(id);
        if (disposable) {
            try {
                disposable.dispose();
            } catch {
                // dispose 실패 무시
            }
            this.disposables.delete(id);
        }

        return true;
    }

    /** 배치 해제: 특정 조건의 모든 리소스 해제 */
    disposeAll(filter?: (r: TrackedResource) => boolean): number {
        let count = 0;
        for (const [id, resource] of this.resources) {
            if (resource.disposed) continue;
            if (filter && !filter(resource)) continue;
            if (this.dispose(id)) count++;
        }
        return count;
    }

    /** 누수 스캔 */
    scanForLeaks(): LeakReport {
        const leaked: TrackedResource[] = [];
        for (const resource of this.resources.values()) {
            if (!resource.disposed) {
                leaked.push(resource);
            }
        }

        return {
            totalTracked: this.resources.size,
            leakedCount: leaked.length,
            leakedResources: leaked,
            heapSizeMB: this.getHeapMB(),
            timestamp: Date.now(),
        };
    }

    /** 주기적 누수 검사 시작 */
    startPeriodicCheck(onLeakDetected: (report: LeakReport) => void): number {
        return window.setInterval(() => {
            const report = this.scanForLeaks();
            if (report.leakedCount > 0) {
                onLeakDetected(report);
                // 누수 리소스 정리
                this.disposeAll(r => true);
            }
        }, this.CHECK_INTERVAL_MS);
    }

    /** 모든 리소스 초기화 (씬 전환 시) */
    reset(): void {
        this.disposeAll();
        this.resources.clear();
        this.disposables.clear();
    }

    private getHeapMB(): number {
        if (typeof performance !== 'undefined' && (performance as any).memory) {
            return Math.round((performance as any).memory.usedJSHeapSize / (1024 * 1024));
        }
        return 0;
    }
}
