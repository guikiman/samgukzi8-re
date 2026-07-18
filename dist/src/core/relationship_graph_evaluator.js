/**
 * [5] 관계망 그래프 평가자 — Relationship Graph Evaluator
 *
 * O(1) 해시맵 구조 정규화 인덱싱
 * 75% 인맥 필터링 (최대 80명 이웃)
 * Ripple Effect 가중치 기반 전파 연산 (+/-3단계)
 */
export class OfficerGraphNode {
    constructor(officerId) {
        this.officerId = officerId;
        this.abilityStats = { STR: 0, DEF: 0, INT: 0, POL: 0 };
        this.relationships = { enemies: new Set(), friends: new Map(), swornBrothers: new Set() };
        this.reputation = 0;
    }
}
export class RelationshipGraphEvaluator {
    constructor() {
        this.nodeStore = new Map();
        this.edgeStore = new Map();
        this.adjMap = new Map();
        this.maxNeighbors = 80;
    }
    edgeKey(a, b) {
        return [a, b].sort().join('->');
    }
    ensureNode(officerId) {
        if (!this.nodeStore.has(officerId)) {
            this.nodeStore.set(officerId, new OfficerGraphNode(officerId));
        }
        return this.nodeStore.get(officerId);
    }
    getNode(officerId) {
        return this.nodeStore.get(officerId) ?? null;
    }
    setRelationship(fromId, toId, weight, type = 'friend') {
        // 75% 인맥 필터링: 이웃 수 제한 + 낮은 우호도 관계 압축
        const neighbors = this.adjMap.get(fromId);
        if (neighbors && neighbors.size >= this.maxNeighbors && weight < 75 && type === 'friend') {
            return;
        }
        this.ensureNode(fromId);
        this.ensureNode(toId);
        const key = this.edgeKey(fromId, toId);
        this.edgeStore.set(key, {
            type,
            weight: Math.max(0, Math.min(100, weight)),
            lastUpdated: Date.now(),
        });
        if (!this.adjMap.has(fromId))
            this.adjMap.set(fromId, new Set());
        this.adjMap.get(fromId).add(toId);
        if (!this.adjMap.has(toId))
            this.adjMap.set(toId, new Set());
        this.adjMap.get(toId).add(fromId);
        const fromNode = this.nodeStore.get(fromId);
        if (type === 'enemy') {
            fromNode.relationships.enemies.add(toId);
            fromNode.relationships.friends.delete(toId);
            fromNode.relationships.swornBrothers.delete(toId);
        }
        else if (type === 'sworn_brother') {
            fromNode.relationships.swornBrothers.add(toId);
            fromNode.relationships.friends.set(toId, weight);
            fromNode.relationships.enemies.delete(toId);
        }
        else {
            fromNode.relationships.friends.set(toId, weight);
            fromNode.relationships.enemies.delete(toId);
        }
    }
    getRelationshipWeight(fromId, toId) {
        const edge = this.edgeStore.get(this.edgeKey(fromId, toId));
        return edge ? edge.weight : 0;
    }
    getRelationshipType(fromId, toId) {
        const edge = this.edgeStore.get(this.edgeKey(fromId, toId));
        return edge ? edge.type : 'neutral';
    }
    /**
     * Ripple Effect — 인맥 파급 효과
     *
     * BFS 최대 depth 2까지 50% 감쇠 전파
     */
    applyRippleEffect(targetId, sourceId, changeAmount, depth = 2) {
        if (!this.nodeStore.has(targetId))
            return;
        const queue = [{ currentId: targetId, currentDepth: 1, currentChange: changeAmount }];
        const visited = new Set([targetId]);
        while (queue.length > 0) {
            const { currentId, currentDepth, currentChange } = queue.shift();
            if (currentDepth > depth)
                continue;
            const neighbors = this.adjMap.get(currentId);
            if (!neighbors)
                continue;
            for (const neighborId of neighbors) {
                if (neighborId === sourceId || visited.has(neighborId))
                    continue;
                const attenuatedChange = Math.trunc(currentChange / 2);
                if (attenuatedChange === 0)
                    continue;
                visited.add(neighborId);
                const oldWeight = this.getRelationshipWeight(neighborId, sourceId);
                const newWeight = Math.max(0, Math.min(100, oldWeight + attenuatedChange));
                const newType = newWeight < 20 ? 'enemy' : 'friend';
                this.setRelationship(neighborId, sourceId, newWeight, newType);
                queue.push({ currentId: neighborId, currentDepth: currentDepth + 1, currentChange: attenuatedChange });
            }
        }
    }
    getNeighbors(officerId) {
        return Array.from(this.adjMap.get(officerId) ?? []);
    }
    /**
     * Dijkstra 기반 최단 가중치 경로 탐색
     * 가중치 = 100 - 우호도 (높은 우호도 = 낮은 비용)
     */
    shortestPath(from, to) {
        if (!this.nodeStore.has(from) || !this.nodeStore.has(to))
            return null;
        if (from === to)
            return [from];
        const distances = new Map();
        const previous = new Map();
        const unvisited = new Set();
        for (const id of this.nodeStore.keys()) {
            distances.set(id, Infinity);
            previous.set(id, null);
            unvisited.add(id);
        }
        distances.set(from, 0);
        while (unvisited.size > 0) {
            let current = null;
            let minDist = Infinity;
            for (const id of unvisited) {
                const d = distances.get(id);
                if (d < minDist) {
                    minDist = d;
                    current = id;
                }
            }
            if (current === null || current === to)
                break;
            unvisited.delete(current);
            const neighbors = this.adjMap.get(current);
            if (!neighbors)
                continue;
            for (const neighbor of neighbors) {
                if (!unvisited.has(neighbor))
                    continue;
                const weight = 100 - (this.getRelationshipWeight(current, neighbor) ?? 0);
                const alt = distances.get(current) + Math.max(1, weight);
                if (alt < distances.get(neighbor)) {
                    distances.set(neighbor, alt);
                    previous.set(neighbor, current);
                }
            }
        }
        if (distances.get(to) === Infinity)
            return null;
        const path = [];
        let step = to;
        while (step !== null) {
            path.unshift(step);
            step = previous.get(step) ?? null;
        }
        return path;
    }
    getAllOfficerIds() {
        return Array.from(this.nodeStore.keys());
    }
    nodeCount() {
        return this.nodeStore.size;
    }
    edgeCount() {
        return this.edgeStore.size;
    }
    reset() {
        this.nodeStore.clear();
        this.edgeStore.clear();
        this.adjMap.clear();
    }
}
//# sourceMappingURL=relationship_graph_evaluator.js.map