/**
 * [30] 트리거 디버깅 및 시각화 가시성 에디터 연동 API — TriggerDebugExporter
 *
 * TriggerDebugExporter:
 *   1. 현재 등록된 트리거의 조건 충족률(%)을 웹 검사기 뷰로 내보내는 JSONExporter
 *   2. 개발자 편의용 상태 덤프
 *   3. 성능 통계 (이벤트당 평가 시간, 히트율)
 */
export class TriggerDebugExporter {
    constructor() {
        this.evalTimings = new Map();
        this.executionCounts = new Map();
    }
    recordEvaluation(eventId, durationMs) {
        if (!this.evalTimings.has(eventId)) {
            this.evalTimings.set(eventId, []);
        }
        this.evalTimings.get(eventId).push(durationMs);
    }
    recordExecution(eventId) {
        this.executionCounts.set(eventId, (this.executionCounts.get(eventId) ?? 0) + 1);
    }
    exportSnapshot(registry) {
        const liveEvents = [];
        const deadEvents = [];
        const allStates = registry.getAllLifecycleStates();
        for (const state of allStates) {
            if (state.isAlive) {
                liveEvents.push(state);
            }
            else {
                deadEvents.push(state);
            }
        }
        const entries = allStates.map(state => ({
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
    getPerformanceStats() {
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
    clear() {
        this.evalTimings.clear();
        this.executionCounts.clear();
    }
}
//# sourceMappingURL=trigger_debug_exporter.js.map