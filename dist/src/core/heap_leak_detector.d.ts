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
export declare class HeapLeakDetector {
    private resources;
    private disposables;
    private readonly CHECK_INTERVAL_MS;
    /** 리소스 등록 */
    register(id: string, type: TrackedResource['type'], disposable?: Disposable): void;
    /** 리소스 해제 */
    dispose(id: string): boolean;
    /** 배치 해제: 특정 조건의 모든 리소스 해제 */
    disposeAll(filter?: (r: TrackedResource) => boolean): number;
    /** 누수 스캔 */
    scanForLeaks(): LeakReport;
    /** 주기적 누수 검사 시작 */
    startPeriodicCheck(onLeakDetected: (report: LeakReport) => void): number;
    /** 모든 리소스 초기화 (씬 전환 시) */
    reset(): void;
    private getHeapMB;
}
export {};
//# sourceMappingURL=heap_leak_detector.d.ts.map