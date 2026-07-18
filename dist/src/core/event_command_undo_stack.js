/**
 * [E59] 이벤트 커맨드 Undo 스택 — EventCommandUndoStack
 *
 * 목적: 플레이어의 모든 액션을 스택에 저장하여
 *       Ctrl+Z로 이전 상태로 되돌리기 가능.
 *
 * 핵심 로직:
 *   1. 실행된 커맨드를 스택에 push
 *   2. Undo 시 역순으로 pop하여 상태 복원
 */
export class EventCommandUndoStack {
    constructor(maxSize = 50) {
        this.stack = [];
        this.onUndoCallbacks = [];
        this.maxSize = maxSize;
    }
    /** 커맨드 실행 및 스택에 추가 */
    executeAndPush(command) {
        command.execute();
        this.stack.push(command);
        // 최대 크기 유지
        if (this.stack.length > this.maxSize) {
            this.stack.shift();
        }
    }
    /** Undo 실행 */
    undo() {
        const command = this.stack.pop();
        if (!command)
            return null;
        command.undo();
        for (const cb of this.onUndoCallbacks) {
            try {
                cb(command);
            }
            catch { /* ignore */ }
        }
        return command;
    }
    /** Undo 콜백 등록 */
    onUndo(callback) {
        this.onUndoCallbacks.push(callback);
    }
    /** 스택 초기화 */
    clear() {
        this.stack = [];
    }
    /** 스택 크기 */
    size() {
        return this.stack.length;
    }
    /** 최근 커맨드 목록 조회 */
    getRecentCommands(count) {
        return this.stack.slice(-count).reverse();
    }
    /** 특정 타입의 마지막 커맨드 찾기 */
    findLastByType(type) {
        for (let i = this.stack.length - 1; i >= 0; i--) {
            if (this.stack[i].type === type)
                return this.stack[i];
        }
        return undefined;
    }
}
//# sourceMappingURL=event_command_undo_stack.js.map