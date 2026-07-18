/**
 * [Task 26] 전염성 감정 전파 — EmotionalContagion
 *
 * 관계망을 통해 무장 간 감정(스트레스/분노/환희)이 전파되는 시스템.
 * 인접한 무장의 심리 상태가 주변으로 확산되는 효과를 모델링.
 */
const DEFAULT_CONFIG = {
    spreadRate: 0.3,
    decayPerTurn: 5,
    affinityBoost: 0.1,
    maxDistance: 2,
    personalityResistance: 0.2,
};
export class EmotionalContagion {
    constructor(config) {
        this.emotions = new Map();
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    initialize(officerId, initial) {
        const state = {
            officerId,
            stress: 0, anger: 0, joy: 0, sadness: 0, fear: 0, calm: 50,
            ...initial,
        };
        this.emotions.set(officerId, state);
        return state;
    }
    getEmotion(officerId) {
        return this.emotions.get(officerId);
    }
    setEmotion(officerId, updates) {
        const current = this.emotions.get(officerId);
        if (!current)
            return;
        this.emotions.set(officerId, { ...current, ...updates });
    }
    /**
     * 감정 전파 실행: 관계 그래프를 따라 감정이 퍼짐
     */
    propagate(relationships, officerIds, personalityMap) {
        const adjacency = this.buildAdjacency(relationships);
        const deltas = new Map();
        for (const id of officerIds) {
            const sourceEmotion = this.emotions.get(id);
            if (!sourceEmotion)
                continue;
            const neighbors = this.getNeighborsWithinDistance(id, adjacency, this.config.maxDistance);
            for (const [neighborId, distance, edgeAffinity] of neighbors) {
                if (neighborId === id)
                    continue;
                const targetEmotion = this.emotions.get(neighborId);
                if (!targetEmotion)
                    continue;
                const affinityFactor = 1 + (edgeAffinity / 100) * this.config.affinityBoost;
                const distanceFactor = 1 / (distance + 1);
                const spread = this.config.spreadRate * affinityFactor * distanceFactor;
                const existing = deltas.get(neighborId) ?? { ...targetEmotion };
                existing.stress = Math.max(0, Math.min(100, existing.stress + sourceEmotion.stress * spread));
                existing.anger = Math.max(0, Math.min(100, existing.anger + sourceEmotion.anger * spread));
                existing.joy = Math.max(0, Math.min(100, existing.joy + sourceEmotion.joy * spread));
                existing.sadness = Math.max(0, Math.min(100, existing.sadness + sourceEmotion.sadness * spread));
                existing.fear = Math.max(0, Math.min(100, existing.fear + sourceEmotion.fear * spread));
                existing.calm = Math.max(0, Math.min(100, existing.calm + sourceEmotion.calm * spread * 0.5));
                deltas.set(neighborId, existing);
            }
        }
        for (const [id, delta] of deltas) {
            const current = this.emotions.get(id);
            if (current) {
                this.emotions.set(id, {
                    ...current,
                    stress: (current.stress + delta.stress) / 2,
                    anger: (current.anger + delta.anger) / 2,
                    joy: (current.joy + delta.joy) / 2,
                    sadness: (current.sadness + delta.sadness) / 2,
                    fear: (current.fear + delta.fear) / 2,
                    calm: (current.calm + delta.calm) / 2,
                });
            }
        }
        return deltas;
    }
    /**
     * 모든 무장의 감정을 턴마다 자연 감소
     */
    decayAll() {
        for (const [id, state] of this.emotions) {
            this.emotions.set(id, {
                ...state,
                stress: Math.max(0, state.stress - this.config.decayPerTurn),
                anger: Math.max(0, state.anger - this.config.decayPerTurn),
                joy: Math.max(0, state.joy - this.config.decayPerTurn * 0.5),
                sadness: Math.max(0, state.sadness - this.config.decayPerTurn),
                fear: Math.max(0, state.fear - this.config.decayPerTurn),
                calm: Math.min(100, state.calm + this.config.decayPerTurn * 0.5),
            });
        }
    }
    /**
     * 특정 사건으로 감정 변화
     */
    applyEvent(officerId, emotionDelta) {
        const current = this.emotions.get(officerId);
        if (!current)
            return;
        const updated = { ...current };
        const emotionKeys = ["stress", "anger", "joy", "sadness", "fear", "calm"];
        for (const key of emotionKeys) {
            const delta = emotionDelta[key];
            if (delta === undefined)
                continue;
            updated[key] = Math.max(0, Math.min(100, updated[key] + delta));
        }
        this.emotions.set(officerId, updated);
    }
    getDominantEmotion(officerId) {
        const state = this.emotions.get(officerId);
        if (!state)
            return { emotion: "CALM", intensity: 50 };
        const entries = [
            { emotion: "STRESS", intensity: state.stress },
            { emotion: "ANGER", intensity: state.anger },
            { emotion: "JOY", intensity: state.joy },
            { emotion: "SADNESS", intensity: state.sadness },
            { emotion: "FEAR", intensity: state.fear },
            { emotion: "CALM", intensity: state.calm },
        ];
        return entries.reduce((max, e) => e.intensity > max.intensity ? e : max);
    }
    buildAdjacency(edges) {
        const adj = new Map();
        for (const edge of edges) {
            if (!adj.has(edge.source))
                adj.set(edge.source, new Map());
            if (!adj.has(edge.target))
                adj.set(edge.target, new Map());
            adj.get(edge.source).set(edge.target, edge.affinity);
            adj.get(edge.target).set(edge.source, edge.affinity);
        }
        return adj;
    }
    getNeighborsWithinDistance(start, adj, maxDistance) {
        const result = [];
        const visited = new Set();
        const queue = [[start, 0]];
        visited.add(start);
        while (queue.length > 0) {
            const [current, dist] = queue.shift();
            const neighbors = adj.get(current);
            if (!neighbors)
                continue;
            for (const [neighbor, affinity] of neighbors) {
                if (visited.has(neighbor))
                    continue;
                visited.add(neighbor);
                const newDist = dist + 1;
                result.push([neighbor, newDist, affinity]);
                if (newDist < maxDistance) {
                    queue.push([neighbor, newDist]);
                }
            }
        }
        return result;
    }
    setConfig(config) {
        this.config = { ...this.config, ...config };
    }
}
//# sourceMappingURL=emotional_contagion.js.map