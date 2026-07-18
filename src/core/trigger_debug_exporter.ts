/**
 * [30] 트리거 디버깅 및 시각화 가시성 에디터 연동 API — TriggerDebugExporter
 *
 * TriggerDebugExporter:
 *   1. 현재 등록된 트리거의 조건 충족률(%)을 웹 검사기 뷰로 내보내는 JSONExporter
 *   2. 개발자 편의용 상태 덤프
 *   3. 성능 통계 (이벤트당 평가 시간, 히트율)
 */

import type { EventTriggerRegistry, TriggerLifecycleState, GameEvent, EventPriority } from './event_trigger_registry.js';

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
    readonly topEvents: Array<{ id: string; name: string; executions: number }>;
}

export class TriggerDebugExporter {
    private evalTimings: Map<string, number[]> = new Map();
    private executionCounts: Map<string, number> = new Map();

    recordEvaluation(eventId: string, durationMs: number): void {
        if (!this.evalTimings.has(eventId)) {
            this.evalTimings.set(eventId, []);
        }
        this.evalTimings.get(eventId)!.push(durationMs);
    }

    recordExecution(eventId: string): void {
        this.executionCounts.set(eventId, (this.executionCounts.get(eventId) ?? 0) + 1);
    }

    exportSnapshot(registry: EventTriggerRegistry): TriggerDebugSnapshot {
        const liveEvents: TriggerLifecycleState[] = [];
        const deadEvents: TriggerLifecycleState[] = [];
        const allStates = registry.getAllLifecycleStates();

        for (const state of allStates) {
            if (state.isAlive) {
                liveEvents.push(state);
            } else {
                deadEvents.push(state);
            }
        }

        const entries: TriggerDebugEntry[] = allStates.map(state => ({
            id: state.eventId,
            name: state.eventId,
            type: state.eventId,
            priority: 'DOMESTIC',
            once: state.maxTriggers === 1,
            triggerCount: state.triggerCount,
            isAlive: state.isAlive,
            registeredAt: state.registeredAt,
        }));

        return {
            timestamp: Date.now(),
            totalEvents: allStates.length,
            liveEvents: liveEvents.length,
            deadEvents: deadEvents.length,
            entries,
        };
    }

    getPerformanceStats(): PerformanceStats {
        let totalEvalTime = 0;
        let totalEvals = 0;
        let totalExecutions = 0;

        for (const times of this.evalTimings.values()) {
            totalEvalTime += times.reduce((s, t) => s + t, 0);
            totalEvals += times.length;
        }

        for (const count of this.executionCounts.values()) {
            totalExecutions += count;
        }

        const topEvents = Array.from(this.executionCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([id, count]) => ({ id, name: id, executions: count }));

        return {
            totalEvaluations: totalEvals,
            totalExecutions,
            averageEvalTimeMs: totalEvals > 0 ? Math.round((totalEvalTime / totalEvals) * 100) / 100 : 0,
            hitRate: totalEvals > 0 ? Math.round((totalExecutions / totalEvals) * 10000) / 100 : 0,
            topEvents,
        };
    }

    clear(): void {
        this.evalTimings.clear();
        this.executionCounts.clear();
    }
}
