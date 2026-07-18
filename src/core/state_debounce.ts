/**
 * [Task 50] 중복 업데이트 방지 디바운스 — StateDebounceManager
 *
 * 짧은 시간 내 중복되는 상태 업데이트를 병합하여
 * 불필요한 리렌더링과 알림을 방지.
 */

export interface DebounceEntry {
  readonly key: string;
  updates: Record<string, unknown>;
  timestamp: number;
  mergeCount: number;
}

export type DebounceCallback = (key: string, mergedUpdates: Record<string, unknown>) => void;

export interface DebounceConfig {
  readonly windowMs: number;
  readonly maxBatchSize: number;
}

const DEFAULT_CONFIG: DebounceConfig = {
  windowMs: 50,
  maxBatchSize: 100,
};

export class StateDebounceManager {
  private pending = new Map<string, DebounceEntry>();
  private config: DebounceConfig;
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private callback: DebounceCallback | null = null;

  constructor(config?: Partial<DebounceConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  setCallback(callback: DebounceCallback): void {
    this.callback = callback;
  }

  /**
   * 업데이트 등록 (중복 병합)
   */
  enqueue(key: string, updates: Record<string, unknown>): void {
    const existing = this.pending.get(key);
    if (existing) {
      existing.updates = { ...existing.updates, ...updates };
      existing.mergeCount++;
      existing.timestamp = Date.now();
    } else {
      this.pending.set(key, {
        key,
        updates: { ...updates },
        timestamp: Date.now(),
        mergeCount: 0,
      });
    }

    if (this.pending.size >= this.config.maxBatchSize) {
      this.flush();
    } else {
      this.scheduleFlush();
    }
  }

  /**
   * 특정 키의 보류 중인 업데이트 조회
   */
  peek(key: string): DebounceEntry | undefined {
    return this.pending.get(key);
  }

  /**
   * 보류 중인 업데이트 수
   */
  get pendingCount(): number {
    return this.pending.size;
  }

  /**
   * 즉시 플러시
   */
  flush(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.pending.size === 0) return;

    const entries = Array.from(this.pending.values());
    this.pending.clear();

    if (this.callback) {
      for (const entry of entries) {
        this.callback(entry.key, entry.updates);
      }
    }
  }

  /**
   * 특정 키 업데이트 강제 플러시
   */
  flushKey(key: string): void {
    const entry = this.pending.get(key);
    if (!entry) return;
    this.pending.delete(key);
    if (this.callback) {
      this.callback(key, entry.updates);
    }
  }

  /**
   * 모든 보류 중인 업데이트 취소
   */
  cancel(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    this.pending.clear();
  }

  /**
   * 특정 키 업데이트 취소
   */
  cancelKey(key: string): void {
    this.pending.delete(key);
  }

  getStats(): { pendingCount: number; windowMs: number; maxBatchSize: number } {
    return {
      pendingCount: this.pending.size,
      windowMs: this.config.windowMs,
      maxBatchSize: this.config.maxBatchSize,
    };
  }

  private scheduleFlush(): void {
    if (this.flushTimer) return;
    this.flushTimer = setTimeout(() => this.flush(), this.config.windowMs);
  }

  setConfig(config: Partial<DebounceConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
