/**
 * 삼국지 8 리메이크 — 고성능 메모리 내 그래프 데이터베이스
 * 파일: src/core/relationship_graph_db.ts
 *
 * 설계 스펙 준수사항:
 * [O(1) 해시맵 구조] → 정규화된 인덱싱 & O(1) 직접 접근 최적화
 * [75% 인맥 필터링]   → 제한적 이웃 조회 (2도 깊이, 80명 최대) + 희소 행렬 압축
 * [Ripple Effect]     → 가중치 기반 전파 연산 (+/-3 단계) 및 상태 지속 주기 관리
 *
 * Performance 목표:
 * - 1,000 무장 노드 그래프 탐색 시간 < 5ms (해시맵 인덱싱 활용)
 * - 메모리 사용량 최적화: 희소 행렬 & 정규화된 스토어 접근 패턴
 *
 * Python 원본: src/systems/graph_db.py → TypeScript 포팅 + 확장
 */
export class TriStateGraphDatabase {
    constructor() {
        this.nodeStore = new Map();
        this.edgeStore = new Map();
        /** 인접 목록 (O(1) 해시셋 탐색용) — 순방향: from → to */
        this.adjMap = new Map();
        /** 역방향 인접 목록 — inMap[to] = { from... } (노드 제거 시 양방향 정리용) */
        this.inMap = new Map();
        // 75% 인맥 네트워크 필터링 전략 (메모리 절감형 최대 이웃 제한 수)
        this.maxNeighborsPer = 80;
    }
    /** 노드 추가 — O(1). 이미 존재하면 기존 노드 반환 */
    addWarlord(warlordId, name) {
        const existing = this.nodeStore.get(warlordId);
        if (existing)
            return existing;
        const node = {
            id: warlordId,
            name: name ?? warlordId,
            stats: { STR: 0, DEF: 0, INT: 0, POL: 0 },
            relationships: {
                enemies: new Set(),
                friends: new Map(),
                subordinates: new Map(),
            },
            reputation: 0,
            statusIdx: 0,
        };
        this.nodeStore.set(warlordId, node);
        if (!this.adjMap.has(warlordId))
            this.adjMap.set(warlordId, new Set());
        if (!this.inMap.has(warlordId))
            this.inMap.set(warlordId, new Set());
        return node;
    }
    getWarlord(warlordId) {
        return this.nodeStore.get(warlordId) ?? null;
    }
    getWarlordCount() {
        return this.nodeStore.size;
    }
    /** 노드 제거 — 순/역방향 에지와 인접 목록을 모두 정리 */
    removeWarlord(warlordId) {
        if (!this.nodeStore.has(warlordId))
            return false;
        // 순방향 에지 정리 (warlordId → n)
        for (const n of this.adjMap.get(warlordId) ?? []) {
            this.edgeStore.delete(edgeKey(warlordId, n));
            this.inMap.get(n)?.delete(warlordId);
        }
        // 역방향 에지 정리 (p → warlordId)
        for (const p of this.inMap.get(warlordId) ?? []) {
            this.edgeStore.delete(edgeKey(p, warlordId));
            this.adjMap.get(p)?.delete(warlordId);
            const pNode = this.nodeStore.get(p);
            pNode?.relationships.enemies.delete(warlordId);
            pNode?.relationships.friends.delete(warlordId);
            pNode?.relationships.subordinates.delete(warlordId);
        }
        this.nodeStore.delete(warlordId);
        this.adjMap.delete(warlordId);
        this.inMap.delete(warlordId);
        return true;
    }
    /**
     * 두 무장 간의 관계 에지를 정규화하여 설정 (O(1)).
     *
     * 75% 인맥 필터링: 특정 무장의 인맥 개수가 임계치를 넘고 우호도가 낮으면
     * 희소 행렬 압축 규칙에 의해 그래프에서 제외 (메모리 방어).
     */
    setRelationship(fromId, toId, weight, edgeType = 'friend') {
        if (fromId === toId)
            return;
        const fromAdj = this.adjMap.get(fromId);
        if (fromAdj && fromAdj.size >= this.maxNeighborsPer && weight < 75 && edgeType === 'friend') {
            return; // 희소 행렬 압축 — 메모리 방어
        }
        this.addWarlord(fromId);
        this.addWarlord(toId);
        const edge = {
            fromId,
            toId,
            type: edgeType,
            weight: Math.max(0, Math.min(100, weight)),
            lastUpdated: Date.now(),
        };
        this.edgeStore.set(edgeKey(fromId, toId), edge);
        this.adjMap.get(fromId).add(toId);
        this.inMap.get(toId).add(fromId);
        // 노드 내부 빠른 참조 인덱스에 직접 바인딩 (O(1))
        const node = this.nodeStore.get(fromId);
        if (edgeType === 'enemy') {
            node.relationships.enemies.add(toId);
        }
        else {
            node.relationships.friends.set(toId, edge.weight);
            if (edgeType === 'sworn_brother') {
                node.relationships.subordinates.set(toId, edge.weight);
            }
        }
    }
    /** 두 무장 간의 우호도 수치를 고속 조회 (O(1)) */
    getRelationshipWeight(fromId, toId) {
        return this.edgeStore.get(edgeKey(fromId, toId))?.weight ?? 0;
    }
    /** 에지 자체 조회 (O(1)) */
    getEdge(fromId, toId) {
        return this.edgeStore.get(edgeKey(fromId, toId)) ?? null;
    }
    /** 특정 무장의 이웃 목록 조회 */
    getNeighbors(warlordId) {
        return Array.from(this.adjMap.get(warlordId) ?? []);
    }
    /** 특정 무장의 적대 목록 */
    getEnemies(warlordId) {
        return Array.from(this.nodeStore.get(warlordId)?.relationships.enemies ?? []);
    }
    // ============================================================
    // [Ripple Effect - 인맥 파급 효과 핵심 알고리즘]
    // ============================================================
    /**
     * source 무장이 target 무장에게 영향(참언, 증정 등)을 주었을 때,
     * target의 최측근(의형제/절친) 네트워크망을 최대 depth(2도)까지 탐색하여
     * 감정 주기를 연쇄적으로 동적 전파(단계별 절반 감쇠)시킨다.
     */
    applyRippleEffect(targetId, sourceId, changeAmount, depth = 2) {
        const log = [];
        if (!this.nodeStore.has(targetId) || changeAmount === 0) {
            return { touchedCount: 0, log };
        }
        // BFS(너비 우선 탐색)를 활용한 2도 깊이 인맥망 추적
        const queue = [
            { id: targetId, deg: 1, change: changeAmount },
        ];
        const visited = new Set([targetId]);
        while (queue.length > 0) {
            const { id: currentId, deg: currentDepth, change: currentChange } = queue.shift();
            if (currentDepth > depth)
                continue;
            // 현재 노드의 이웃(친구/의형제)들 스캔
            const neighbors = this.adjMap.get(currentId);
            if (!neighbors)
                continue;
            for (const neighborId of neighbors) {
                if (neighborId === sourceId || visited.has(neighborId))
                    continue;
                // 관계 밀도에 따른 감쇠 법칙 연산 (단계별 절반 감쇠)
                const attenuated = Math.trunc(currentChange / 2);
                if (attenuated === 0)
                    continue;
                visited.add(neighborId);
                // 최측근의 우호도 실시간 업데이트
                const oldWeight = this.getRelationshipWeight(neighborId, sourceId);
                const newWeight = Math.max(0, Math.min(100, oldWeight + attenuated));
                // 관계 데이터 인접 행렬 갱신
                this.setRelationship(neighborId, sourceId, newWeight, newWeight < 20 ? 'enemy' : 'friend');
                log.push({
                    degree: currentDepth,
                    neighborId,
                    sourceId,
                    oldWeight,
                    newWeight,
                });
                // 다음 깊이(2도) 인맥으로 파동 연쇄 전달
                queue.push({ id: neighborId, deg: currentDepth + 1, change: attenuated });
            }
        }
        return { touchedCount: log.length, log };
    }
    /** 테스트/진단용 — 현재 에지 총 개수 */
    getEdgeCount() {
        return this.edgeStore.size;
    }
    /** 인덱스 전체 초기화 — 월드 재구축/세이브 복원 시 파생 상태 리셋용 */
    clear() {
        this.nodeStore.clear();
        this.edgeStore.clear();
        this.adjMap.clear();
        this.inMap.clear();
    }
    /** 직렬화 (세이브/Worker 전송용) */
    serialize() {
        return {
            nodes: Array.from(this.nodeStore.values()).map(n => ({
                id: n.id, name: n.name, stats: { ...n.stats }, reputation: n.reputation,
            })),
            edges: Array.from(this.edgeStore.values()).map(e => ({
                fromId: e.fromId, toId: e.toId, type: e.type, weight: e.weight,
            })),
        };
    }
    /** 역직렬화 (세이브 복원용) */
    static deserialize(data) {
        const db = new TriStateGraphDatabase();
        for (const n of data.nodes) {
            const node = db.addWarlord(n.id, n.name);
            node.stats = { ...n.stats };
            node.reputation = n.reputation;
        }
        for (const e of data.edges) {
            db.setRelationship(e.fromId, e.toId, e.weight, e.type);
        }
        return db;
    }
}
function edgeKey(fromId, toId) {
    return `${fromId}\u0000${toId}`;
}
//# sourceMappingURL=relationship_graph_db.js.map