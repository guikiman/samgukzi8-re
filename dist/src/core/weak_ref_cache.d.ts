export declare class WeakRefCache<K extends object, V extends object> {
    private readonly cache;
    private readonly registry;
    constructor();
    set(key: K, value: V): void;
    get(key: K): V | undefined;
    has(key: K): boolean;
    delete(key: K): boolean;
    garbageCollect(): number;
    get size(): number;
}
export declare class WeakValueMap<K, V extends object> {
    private readonly map;
    private readonly registry;
    constructor();
    set(key: K, value: V): void;
    get(key: K): V | undefined;
    has(key: K): boolean;
    delete(key: K): boolean;
    garbageCollect(): number;
    get size(): number;
}
export declare class ListenerRegistry {
    private readonly listeners;
    private readonly registry;
    constructor();
    register(target: object, type: string, handler: () => void): void;
    garbageCollect(): number;
    get size(): number;
}
export declare class WeakGraphEdge<K extends object, V extends object> {
    private readonly edges;
    private readonly registry;
    constructor();
    set(from: K, to: V): void;
    get(from: K): V | undefined;
    delete(from: K): boolean;
    garbageCollect(): number;
}
export declare class GarbageCollector {
    private readonly caches;
    private intervalId;
    register(cache: {
        garbageCollect(): number;
    }): void;
    startAutoCleanup(intervalMs?: number): void;
    stopAutoCleanup(): void;
    garbageCollectAll(): number;
}
//# sourceMappingURL=weak_ref_cache.d.ts.map