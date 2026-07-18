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
export interface UndoableCommand {
    readonly id: string;
    readonly type: string;
    readonly timestamp: number;
    readonly execute: () => void;
    readonly undo: () => void;
    readonly description: string;
}
export declare class EventCommandUndoStack {
    private stack;
    private maxSize;
    private onUndoCallbacks;
    constructor(maxSize?: number);
    /** 커맨드 실행 및 스택에 추가 */
    executeAndPush(command: UndoableCommand): void;
    /** Undo 실행 */
    undo(): UndoableCommand | null;
    /** Undo 콜백 등록 */
    onUndo(callback: (command: UndoableCommand) => void): void;
    /** 스택 초기화 */
    clear(): void;
    /** 스택 크기 */
    size(): number;
    /** 최근 커맨드 목록 조회 */
    getRecentCommands(count: number): UndoableCommand[];
    /** 특정 타입의 마지막 커맨드 찾기 */
    findLastByType(type: string): UndoableCommand | undefined;
}
//# sourceMappingURL=event_command_undo_stack.d.ts.map