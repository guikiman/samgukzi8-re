/**
 * [Task 9] 인메모리 스냅샷 버퍼 스택
 *
 * 턴 실행 중 브라우저 크래시나 메모리 누수 발생 시
 * 직전 페이즈로 롤백할 수 있는 스냅샷 버퍼 스택 (최대 5개).
 */
export declare class StateBackupStack<T extends object> {
    private snapshots;
    private readonly maxSnapshots;
    constructor(maxSnapshots?: number);
    push(state: T): void;
    pop(): T | null;
    peek(): T | null;
    get size(): number;
    clear(): void;
}
//# sourceMappingURL=state_backup.d.ts.map