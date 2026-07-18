/**
 * [Task 98] 메모리 릭/순환 참조 실시간 추적 — MemoryLeakTracer
 *
 * 객체 참조 추적을 통해 순환 참조와 메모리 누수를 탐지.
 */
export interface LeakReport {
    readonly timestamp: number;
    readonly trackedObjects: number;
    readonly circularReferences: number;
    readonly suspiciousGrowth: boolean;
    readonly details: string[];
}
export declare class MemoryLeakTracer {
    private trackedObjects;
    private snapshotHistory;
    private readonly maxSnapshots;
    private referenceGraph;
    constructor(maxSnapshots?: number);
    track(obj: object, dependencies?: object[]): void;
    untrack(obj: object): void;
    takeSnapshot(): void;
    detectCircularReferences(): number;
    getReport(): LeakReport;
    clear(): void;
}
//# sourceMappingURL=memory_leak_tracer.d.ts.map