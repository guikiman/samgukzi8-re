export class WeakRefCache<K extends object, V extends object> {
  private readonly cache = new Map<K, WeakRef<V>>();
  private readonly registry: FinalizationRegistry<K>;

  constructor() {
    this.registry = new FinalizationRegistry<K>((key: K) => {
      this.cache.delete(key);
    });
  }

  set(key: K, value: V): void {
    this.cache.set(key, new WeakRef(value));
    this.registry.register(value, key);
  }

  get(key: K): V | undefined {
    const ref = this.cache.get(key);
    if (!ref) return undefined;
    const value = ref.deref();
    if (value === undefined) {
      this.cache.delete(key);
      return undefined;
    }
    return value;
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  garbageCollect(): number {
    let collected = 0;
    for (const [key, ref] of this.cache) {
      if (ref.deref() === undefined) {
        this.cache.delete(key);
        collected++;
      }
    }
    return collected;
  }

  get size(): number {
    this.garbageCollect();
    return this.cache.size;
  }
}

export class WeakValueMap<K, V extends object> {
  private readonly map = new Map<K, WeakRef<V>>();
  private readonly registry: FinalizationRegistry<K>;

  constructor() {
    this.registry = new FinalizationRegistry<K>((key: K) => {
      this.map.delete(key);
    });
  }

  set(key: K, value: V): void {
    this.map.set(key, new WeakRef(value));
    this.registry.register(value, key);
  }

  get(key: K): V | undefined {
    const ref = this.map.get(key);
    if (!ref) return undefined;
    const value = ref.deref();
    if (value === undefined) {
      this.map.delete(key);
      return undefined;
    }
    return value;
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: K): boolean {
    return this.map.delete(key);
  }

  garbageCollect(): number {
    let collected = 0;
    for (const [key, ref] of this.map) {
      if (ref.deref() === undefined) {
        this.map.delete(key);
        collected++;
      }
    }
    return collected;
  }

  get size(): number {
    this.garbageCollect();
    return this.map.size;
  }
}

export class ListenerRegistry {
  private readonly listeners = new Set<{ target: WeakRef<object>; type: string; handler: () => void }>();
  private readonly registry: FinalizationRegistry<object>;

  constructor() {
    this.registry = new FinalizationRegistry<object>((_key: object) => {
      this.garbageCollect();
    });
  }

  register(target: object, type: string, handler: () => void): void {
    const ref = new WeakRef(target);
    this.listeners.add({ target: ref, type, handler });
    this.registry.register(target, target);
  }

  garbageCollect(): number {
    let collected = 0;
    for (const entry of this.listeners) {
      if (entry.target.deref() === undefined) {
        this.listeners.delete(entry);
        collected++;
      }
    }
    return collected;
  }

  get size(): number {
    this.garbageCollect();
    return this.listeners.size;
  }
}

export class WeakGraphEdge<K extends object, V extends object> {
  private readonly edges = new Map<K, WeakRef<V>>();
  private readonly registry: FinalizationRegistry<K>;

  constructor() {
    this.registry = new FinalizationRegistry<K>((key: K) => {
      this.edges.delete(key);
    });
  }

  set(from: K, to: V): void {
    this.edges.set(from, new WeakRef(to));
    this.registry.register(to, from);
  }

  get(from: K): V | undefined {
    const ref = this.edges.get(from);
    if (!ref) return undefined;
    const value = ref.deref();
    if (value === undefined) {
      this.edges.delete(from);
      return undefined;
    }
    return value;
  }

  delete(from: K): boolean {
    return this.edges.delete(from);
  }

  garbageCollect(): number {
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
  private readonly caches: Array<{ garbageCollect(): number }> = [];
  private intervalId: ReturnType<typeof setInterval> | null = null;

  register(cache: { garbageCollect(): number }): void {
    this.caches.push(cache);
  }

  startAutoCleanup(intervalMs = 30000): void {
    if (this.intervalId) return;
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

  stopAutoCleanup(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  garbageCollectAll(): number {
    let total = 0;
    for (const cache of this.caches) {
      total += cache.garbageCollect();
    }
    return total;
  }
}