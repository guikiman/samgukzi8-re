export class WeakRefCache {
    constructor() {
        this.cache = new Map();
        this.registry = new FinalizationRegistry((key) => {
            this.cache.delete(key);
        });
    }
    set(key, value) {
        this.cache.set(key, new WeakRef(value));
        this.registry.register(value, key);
    }
    get(key) {
        const ref = this.cache.get(key);
        if (!ref)
            return undefined;
        const value = ref.deref();
        if (value === undefined) {
            this.cache.delete(key);
            return undefined;
        }
        return value;
    }
    has(key) {
        return this.get(key) !== undefined;
    }
    delete(key) {
        return this.cache.delete(key);
    }
    garbageCollect() {
        let collected = 0;
        for (const [key, ref] of this.cache) {
            if (ref.deref() === undefined) {
                this.cache.delete(key);
                collected++;
            }
        }
        return collected;
    }
    get size() {
        this.garbageCollect();
        return this.cache.size;
    }
}
export class WeakValueMap {
    constructor() {
        this.map = new Map();
        this.registry = new FinalizationRegistry((key) => {
            this.map.delete(key);
        });
    }
    set(key, value) {
        this.map.set(key, new WeakRef(value));
        this.registry.register(value, key);
    }
    get(key) {
        const ref = this.map.get(key);
        if (!ref)
            return undefined;
        const value = ref.deref();
        if (value === undefined) {
            this.map.delete(key);
            return undefined;
        }
        return value;
    }
    has(key) {
        return this.get(key) !== undefined;
    }
    delete(key) {
        return this.map.delete(key);
    }
    garbageCollect() {
        let collected = 0;
        for (const [key, ref] of this.map) {
            if (ref.deref() === undefined) {
                this.map.delete(key);
                collected++;
            }
        }
        return collected;
    }
    get size() {
        this.garbageCollect();
        return this.map.size;
    }
}
export class ListenerRegistry {
    constructor() {
        this.listeners = new Set();
        this.registry = new FinalizationRegistry((_key) => {
            this.garbageCollect();
        });
    }
    register(target, type, handler) {
        const ref = new WeakRef(target);
        this.listeners.add({ target: ref, type, handler });
        this.registry.register(target, target);
    }
    garbageCollect() {
        let collected = 0;
        for (const entry of this.listeners) {
            if (entry.target.deref() === undefined) {
                this.listeners.delete(entry);
                collected++;
            }
        }
        return collected;
    }
    get size() {
        this.garbageCollect();
        return this.listeners.size;
    }
}
export class WeakGraphEdge {
    constructor() {
        this.edges = new Map();
        this.registry = new FinalizationRegistry((key) => {
            this.edges.delete(key);
        });
    }
    set(from, to) {
        this.edges.set(from, new WeakRef(to));
        this.registry.register(to, from);
    }
    get(from) {
        const ref = this.edges.get(from);
        if (!ref)
            return undefined;
        const value = ref.deref();
        if (value === undefined) {
            this.edges.delete(from);
            return undefined;
        }
        return value;
    }
    delete(from) {
        return this.edges.delete(from);
    }
    garbageCollect() {
        let collected = 0;
        for (const [key, ref] of this.edges) {
            if (ref.deref() === undefined) {
                this.edges.delete(key);
                collected++;
            }
        }
        return collected;
    }
}
export class GarbageCollector {
    constructor() {
        this.caches = [];
        this.intervalId = null;
    }
    register(cache) {
        this.caches.push(cache);
    }
    startAutoCleanup(intervalMs = 30000) {
        if (this.intervalId)
            return;
        this.intervalId = setInterval(() => {
            let total = 0;
            for (const cache of this.caches) {
                total += cache.garbageCollect();
            }
            if (total > 0) {
                console.log(`[GC] Auto-cleaned ${total} stale references`);
            }
        }, intervalMs);
    }
    stopAutoCleanup() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
    garbageCollectAll() {
        let total = 0;
        for (const cache of this.caches) {
            total += cache.garbageCollect();
        }
        return total;
    }
}
//# sourceMappingURL=weak_ref_cache.js.map