/**
 * [6] 턴 스케줄러 일시정지 및 핫 리로드 상태 스택 — HotReloadStateStack
 *
 * 목적: 턴 상태 스택 관리.
 */
export class HotReloadStateStack {
    constructor() {
        this.stack = [];
    }
    push(state) { this.stack.push(state); }
    pop() { return this.stack.pop(); }
}
//# sourceMappingURL=hot_reload_state_stack.js.map