/**
 * [Task 24] 에지 가중치 업데이트 원자화 — EdgeWeightAtomic
 *
 * 친밀도 변경을 원자적으로 수행하고 이벤트 발행.
 */
const DEFAULT_CONFIG = {
    minAffinity: -100,
    maxAffinity: 100,
    maxDeltaPerUpdate: 50,
};
export class EdgeWeightAtomic {
    constructor(config) {
        this.edges = new Map();
        this.listeners = new Set();
        this.changeHistory = new Map();
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    edgeKey(source, target, type) {
        return `${source}_${target}_${type}`;
    }
    registerEdge(edge) {
        this.edges.set(this.edgeKey(edge.source, edge.target, edge.type), edge);
    }
    updateAffinity(source, target, type, delta, reason, year, month) {
        const key = this.edgeKey(source, target, type);
        let edge = this.edges.get(key);
        if (!edge) {
            const reverseKey = this.edgeKey(target, source, type);
            edge = this.edges.get(reverseKey);
        }
        if (!edge)
            return { success: false, oldAffinity: 0, newAffinity: 0, clamped: false };
        const clampedDelta = Math.max(-this.config.maxDeltaPerUpdate, Math.min(this.config.maxDeltaPerUpdate, delta));
        const oldAffinity = edge.affinity;
        let newAffinity = oldAffinity + clampedDelta;
        let clamped = false;
        if (newAffinity > this.config.maxAffinity) {
            newAffinity = this.config.maxAffinity;
            clamped = true;
        }
        if (newAffinity < this.config.minAffinity) {
            newAffinity = this.config.minAffinity;
            clamped = true;
        }
        edge.affinity = newAffinity;
        edge.history.push({ year, month, event: reason, delta: clampedDelta });
        if (!this.changeHistory.has(key))
            this.changeHistory.set(key, []);
        this.changeHistory.get(key).push({ oldAffinity });
        const event = {
            source, target, type, oldAffinity, newAffinity, delta: clampedDelta, timestamp: Date.now(), reason,
        };
        for (const listener of this.listeners)
            listener(event);
        return { success: true, oldAffinity, newAffinity, clamped };
    }
    getAffinity(source, target, type) {
        const edge = this.getEdge(source, target, type);
        return edge?.affinity ?? null;
    }
    getEdge(source, target, type) {
        return this.edges.get(this.edgeKey(source, target, type))
            ?? this.edges.get(this.edgeKey(target, source, type))
            ?? null;
    }
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    rollbackLastChange(source, target, type) {
        const key = this.edgeKey(source, target, type);
        const history = this.changeHistory.get(key);
        if (!history || history.length === 0)
            return false;
        const entry = history.pop();
        const edge = this.edges.get(key);
        if (edge) {
            edge.affinity = entry.oldAffinity;
            edge.history.pop();
        }
        return true;
    }
    getChangeHistory(source, target, type) {
        const edge = this.getEdge(source, target, type);
        return edge ? [...edge.history] : [];
    }
    clearEdges() {
        this.edges.clear();
        this.changeHistory.clear();
    }
}
//# sourceMappingURL=edge_weight_atomic.js.map