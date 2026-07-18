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
export declare class StateDebounceManager {
    private pending;
    private config;
    private flushTimer;
    private callback;
    constructor(config?: Partial<DebounceConfig>);
    setCallback(callback: DebounceCallback): void;
    /**
     * 업데이트 등록 (중복 병합)
     */
    enqueue(key: string, updates: Record<string, unknown>): void;
    /**
     * 특정 키의 보류 중인 업데이트 조회
     */
    peek(key: string): DebounceEntry | undefined;
    /**
     * 보류 중인 업데이트 수
     */
    get pendingCount(): number;
    /**
     * 즉시 플러시
     */
    flush(): void;
    /**
     * 특정 키 업데이트 강제 플러시
     */
    flushKey(key: string): void;
    /**
     * 모든 보류 중인 업데이트 취소
     */
    cancel(): void;
    /**
     * 특정 키 업데이트 취소
     */
    cancelKey(key: string): void;
    getStats(): {
        pendingCount: number;
        windowMs: number;
        maxBatchSize: number;
    };
    private scheduleFlush;
    setConfig(config: Partial<DebounceConfig>): void;
}
//# sourceMappingURL=state_debounce.d.ts.map