/**
 * [Task 30] 커맨드 롤백 데이터 구조 (Undo Buffer)
 *
 * 단일 턴 내에서 플레이어가 제출한 명령을 확정하기 전에
 * 한 단계씩 안전하게 취소할 수 있는 명령 Undo 아카이브.
 */
export interface UndoEntry<T> {
    readonly factionId: string;
    readonly command: T;
    readonly previousState: T;
    readonly timestamp: number;
}
export declare class UndoBuffer<T> {
    private stack;
    private readonly maxDepth;
    constructor(maxDepth?: number);
    push(factionId: string, command: T, previousState: T): void;
    undo(): UndoEntry<T> | null;
    peek(): UndoEntry<T> | null;
    clear(): void;
    get size(): number;
}
//# sourceMappingURL=undo_buffer.d.ts.map