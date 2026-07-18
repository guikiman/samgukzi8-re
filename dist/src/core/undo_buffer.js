/**
 * [Task 30] 커맨드 롤백 데이터 구조 (Undo Buffer)
 *
 * 단일 턴 내에서 플레이어가 제출한 명령을 확정하기 전에
 * 한 단계씩 안전하게 취소할 수 있는 명령 Undo 아카이브.
 */
export class UndoBuffer {
    constructor(maxDepth = 10) {
        this.stack = [];
        this.maxDepth = maxDepth;
    }
    push(factionId, command, previousState) {
        this.stack.push({ factionId, command, previousState, timestamp: Date.now() });
        if (this.stack.length > this.maxDepth) {
            this.stack.shift();
        }
    }
    undo() {
        return this.stack.pop() ?? null;
    }
    peek() {
        return this.stack.length > 0 ? this.stack[this.stack.length - 1] : null;
    }
    clear() {
        this.stack = [];
    }
    get size() {
        return this.stack.length;
    }
}
//# sourceMappingURL=undo_buffer.js.map