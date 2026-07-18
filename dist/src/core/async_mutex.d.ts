/**
 * [Task 17] 비동기 상호배제(Mutex) 락
 *
 * 연산이 완료되기 전까지 새로운 루프 주기가 시작되지
 * 않도록 제어하는 비동기 뮤텍스.
 */
export declare class AsyncMutex {
    private locked;
    private queue;
    acquire(): Promise<void>;
    release(): void;
    get isLocked(): boolean;
}
//# sourceMappingURL=async_mutex.d.ts.map