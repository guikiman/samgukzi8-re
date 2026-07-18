/**
 * [10] 데드락 방지 '이벤트 서사 그래프(Story DAG)' 파서
 *
 * EventDAGParser:
 *   - 모든 이벤트 관계를 유향 비순환 그래프(DAG) 구조로 정규화
 *   - 상충 조건 발생 시 사전 예외 처리 및 우회
 *   - XState 상태 머신 기반 정적 세이브 분석기
 */
export class EventDAGParser {
    constructor() {
        this.nodes = new Map();
        this.completedEvents = new Set();
    }
    registerNode(node) {
        this.nodes.set(node.id, node);
    }
    completeEvent(id) {
        this.completedEvents.add(id);
    }
    /**
     * [10] DAG 정적 분석 — 데드락 및 사이클 감지
     */
    validateDAG() {
        const visited = new Set();
        const recStack = new Set();
        const cyclePath = [];
        const dfs = (nodeId, path) => {
            if (recStack.has(nodeId)) {
                cyclePath.push(...path.slice(path.indexOf(nodeId)), nodeId);
                return true;
            }
            if (visited.has(nodeId))
                return false;
            visited.add(nodeId);
            recStack.add(nodeId);
            path.push(nodeId);
            const node = this.nodes.get(nodeId);
            if (node) {
                for (const prereq of node.prerequisites) {
                    if (dfs(prereq, path))
                        return true;
                }
            }
            recStack.delete(nodeId);
            path.pop();
            return false;
        };
        const hasCycle = [...this.nodes.keys()].some(id => dfs(id, []));
        const deadlocked = [];
        for (const node of this.nodes.values()) {
            for (const conflict of node.conflictsWith) {
                const conflictNode = this.nodes.get(conflict);
                if (conflictNode && this.areBothActive(node, conflictNode)) {
                    deadlocked.push(node.id);
                }
            }
        }
        return {
            hasCycle,
            cyclePath: [...cyclePath],
            deadlockedEvents: deadlocked,
            resolvedConflicts: this.resolveConflicts(deadlocked),
        };
    }
    areBothActive(a, b) {
        const aReady = a.prerequisites.every(p => this.completedEvents.has(p));
        const bReady = b.prerequisites.every(p => this.completedEvents.has(p));
        return aReady && bReady;
    }
    resolveConflicts(deadlocked) {
        return deadlocked
            .map(id => this.nodes.get(id))
            .filter((n) => n !== null)
            .sort((a, b) => b.priority - a.priority)
            .slice(0, Math.ceil(deadlocked.length / 2))
            .map(n => n.id);
    }
}
//# sourceMappingURL=event_dag.js.map