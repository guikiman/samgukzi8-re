/**
 * [Task 98] 메모리 릭/순환 참조 실시간 추적 — MemoryLeakTracer
 *
 * 객체 참조 추적을 통해 순환 참조와 메모리 누수를 탐지.
 */
export class MemoryLeakTracer {
    constructor(maxSnapshots = 50) {
        this.trackedObjects = new Set();
        this.snapshotHistory = [];
        this.referenceGraph = new Map();
        this.maxSnapshots = maxSnapshots;
    }
    track(obj, dependencies) {
        this.trackedObjects.add(obj);
        if (dependencies) {
            const deps = this.referenceGraph.get(obj) ?? new Set();
            for (const dep of dependencies) {
                deps.add(dep);
            }
            this.referenceGraph.set(obj, deps);
        }
    }
    untrack(obj) {
        this.trackedObjects.delete(obj);
        this.referenceGraph.delete(obj);
        for (const [, deps] of this.referenceGraph) {
            deps.delete(obj);
        }
    }
    takeSnapshot() {
        this.snapshotHistory.push(this.trackedObjects.size);
        if (this.snapshotHistory.length > this.maxSnapshots) {
            this.snapshotHistory.shift();
        }
    }
    detectCircularReferences() {
        const visited = new Set();
        const inStack = new Set();
        let circularCount = 0;
        const dfs = (node) => {
            if (inStack.has(node)) {
                circularCount++;
                return;
            }
            if (visited.has(node))
                return;
            visited.add(node);
            inStack.add(node);
            const deps = this.referenceGraph.get(node);
            if (deps) {
                for (const dep of deps) {
                    dfs(dep);
                }
            }
            inStack.delete(node);
        };
        for (const obj of this.trackedObjects) {
            dfs(obj);
        }
        return circularCount;
    }
    getReport() {
        const circularRefs = this.detectCircularReferences();
        const suspiciousGrowth = this.snapshotHistory.length > 3
            && this.snapshotHistory[this.snapshotHistory.length - 1]
                > this.snapshotHistory[0] * 2;
        const details = [
            `Tracked objects: ${this.trackedObjects.size}`,
            `Circular references detected: ${circularRefs}`,
            `Active reference graph entries: ${this.referenceGraph.size}`,
        ];
        if (suspiciousGrowth) {
            details.push("WARNING: Object count has doubled since first snapshot");
        }
        if (this.snapshotHistory.length >= 2) {
            const first = this.snapshotHistory[0];
            const last = this.snapshotHistory[this.snapshotHistory.length - 1];
            details.push(`Growth: ${first} -> ${last} (${(last - first > 0 ? "+" : "")}${last - first})`);
        }
        return {
            timestamp: Date.now(),
            trackedObjects: this.trackedObjects.size,
            circularReferences: circularRefs,
            suspiciousGrowth,
            details,
        };
    }
    clear() {
        this.trackedObjects.clear();
        this.referenceGraph.clear();
        this.snapshotHistory = [];
    }
}
//# sourceMappingURL=memory_leak_tracer.js.map