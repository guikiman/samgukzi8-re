/**
 * [30] 트리거 디버깅 및 시각화 가시성 에디터 연동 API — TriggerDebugExporter
 *
 * TriggerDebugExporter:
 *   1. 현재 등록된 트리거의 조건 충족률(%)을 웹 검사기 뷰로 내보내는 JSONExporter
 *   2. 개발자 편의용 상태 덤프
 *   3. 성능 통계 (이벤트당 평가 시간, 히트율)
 */
import type { EventTriggerRegistry, EventPriority } from './event_trigger_registry.js';
export interface TriggerDebugEntry {
    readonly id: string;
    readonly name: string;
    readonly type: string;
    readonly priority: EventPriority;
    readonly once: boolean;
    readonly triggerCount: number;
    readonly isAlive: boolean;
    readonly registeredAt: number;
}
export interface TriggerDebugSnapshot {
    readonly timestamp: number;
    readonly totalEvents: number;
    readonly liveEvents: number;
    readonly deadEvents: number;
    readonly entries: TriggerDebugEntry[];
}
export interface PerformanceStats {
    readonly totalEvaluations: number;
    readonly totalExecutions: number;
    readonly averageEvalTimeMs: number;
    readonly hitRate: number;
    readonly topEvents: Array<{
        id: string;
        name: string;
        executions: number;
    }>;
}
export declare class TriggerDebugExporter {
    private evalTimings;
    private executionCounts;
    recordEvaluation(eventId: string, durationMs: number): void;
    recordExecution(eventId: string): void;
    exportSnapshot(registry: EventTriggerRegistry): TriggerDebugSnapshot;
    getPerformanceStats(): PerformanceStats;
    clear(): void;
}
//# sourceMappingURL=trigger_debug_exporter.d.ts.map