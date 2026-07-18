/**
 * [31][32] FSMState 추상 클래스 + GameStateMachine HFSM 코어
 *
 * FSMState (Task 31):
 *   - onEnter(), onUpdate(), onExit(), onPause(), onResume() 지원
 * GameStateMachine (Task 32):
 *   - 계층형 상태 머신(HFSM) 스택 구조
 *   - 하위 상태(Sub-state) 진입 후 복귀 가능
 */
export class FSMState {
    constructor(name) {
        this.name = name;
    }
    onPause() { }
    onResume() { }
    getStateMachine() {
        return FSMState.activeMachine;
    }
}
FSMState.activeMachine = null;
export class GameStateMachine {
    constructor() {
        this.states = new Map();
        this.stack = [];
        this.transitions = [];
        this.maxStackDepth = 10;
    }
    registerState(state) {
        this.states.set(state.name, state);
    }
    unregisterState(name) {
        this.states.delete(name);
    }
    async transitionTo(name, context = {}) {
        const target = this.states.get(name);
        if (!target) {
            console.warn(`[FSM] State '${name}' not found`);
            return false;
        }
        if (this.stack.length > 0) {
            const current = this.stack[this.stack.length - 1].state;
            this.transitions.push({
                from: current.name,
                to: name,
                reason: 'transition',
                timestamp: Date.now(),
            });
            await this.safeCall(() => current.onExit());
        }
        FSMState['activeMachine'] = this;
        const frame = { state: target, enteredAt: Date.now() };
        this.stack.push(frame);
        await this.safeCall(() => target.onEnter(context));
        return true;
    }
    async pushState(name, context = {}) {
        const target = this.states.get(name);
        if (!target || this.stack.length >= this.maxStackDepth)
            return false;
        if (this.stack.length > 0) {
            const current = this.stack[this.stack.length - 1].state;
            this.transitions.push({
                from: current.name,
                to: name,
                reason: 'push',
                timestamp: Date.now(),
            });
            await this.safeCall(() => current.onPause());
        }
        FSMState['activeMachine'] = this;
        const frame = { state: target, enteredAt: Date.now() };
        this.stack.push(frame);
        await this.safeCall(() => target.onEnter(context));
        return true;
    }
    async popState() {
        if (this.stack.length <= 1)
            return false;
        const current = this.stack.pop();
        await this.safeCall(() => current.state.onExit());
        const previous = this.stack[this.stack.length - 1];
        this.transitions.push({
            from: current.state.name,
            to: previous.state.name,
            reason: 'pop',
            timestamp: Date.now(),
        });
        await this.safeCall(() => previous.state.onResume());
        return true;
    }
    update(dt) {
        if (this.stack.length > 0) {
            this.stack[this.stack.length - 1].state.onUpdate(dt);
        }
    }
    getCurrentState() {
        return this.stack.length > 0 ? this.stack[this.stack.length - 1].state : null;
    }
    getCurrentStateName() {
        return this.getCurrentState()?.name ?? null;
    }
    getStackDepth() {
        return this.stack.length;
    }
    getTransitionHistory() {
        return [...this.transitions];
    }
    isStateActive(name) {
        return this.stack.some(f => f.state.name === name);
    }
    findState(name) {
        return this.states.get(name);
    }
    async safeCall(fn) {
        try {
            const result = fn();
            if (result instanceof Promise)
                await result;
        }
        catch (err) {
            console.error('[FSM] Error:', err);
        }
    }
    reset() {
        this.stack = [];
        this.transitions = [];
    }
}
//# sourceMappingURL=fsm_state.js.map