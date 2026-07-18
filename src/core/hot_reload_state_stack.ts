/**
 * [6] 턴 스케줄러 일시정지 및 핫 리로드 상태 스택 — HotReloadStateStack
 * 
 * 목적: 턴 상태 스택 관리.
 */
export class HotReloadStateStack {
    private stack: any[] = [];
    public push(state: any): void { this.stack.push(state); }
    public pop(): any { return this.stack.pop(); }
}
