/**
 * [31][32] FSMState 추상 클래스 + GameStateMachine HFSM 코어
 *
 * FSMState (Task 31):
 *   - onEnter(), onUpdate(), onExit(), onPause(), onResume() 지원
 * GameStateMachine (Task 32):
 *   - 계층형 상태 머신(HFSM) 스택 구조
 *   - 하위 상태(Sub-state) 진입 후 복귀 가능
 */

export abstract class FSMState {
    readonly name: string;

    constructor(name: string) {
        this.name = name;
    }

    abstract onEnter(context: Record<string, unknown>): void | Promise<void>;
    abstract onUpdate(dt: number): void;
    abstract onExit(): void | Promise<void>;

    onPause(): void {}
    onResume(): void {}

    protected getStateMachine(): GameStateMachine | null {
        return FSMState.activeMachine;
    }

    private static activeMachine: GameStateMachine | null = null;
}

export type StateConstructor = new (...args: unknown[]) => FSMState;

export interface StateTransition {
    readonly from: string;
    readonly to: string;
    readonly reason: string;
    readonly timestamp: number;
}

interface StackFrame {
    state: FSMState;
    enteredAt: number;
}

export class GameStateMachine {
    private states: Map<string, FSMState> = new Map();
    private stack: StackFrame[] = [];
    private transitions: StateTransition[] = [];
    private maxStackDepth = 10;

    registerState(state: FSMState): void {
        this.states.set(state.name, state);
    }

    unregisterState(name: string): void {
        this.states.delete(name);
    }

    async transitionTo(name: string, context: Record<string, unknown> = {}): Promise<boolean> {
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
        const frame: StackFrame = { state: target, enteredAt: Date.now() };
        this.stack.push(frame);

        await this.safeCall(() => target.onEnter(context));
        return true;
    }

    async pushState(name: string, context: Record<string, unknown> = {}): Promise<boolean> {
        const target = this.states.get(name);
        if (!target || this.stack.length >= this.maxStackDepth) return false;

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
        const frame: StackFrame = { state: target, enteredAt: Date.now() };
        this.stack.push(frame);

        await this.safeCall(() => target.onEnter(context));
        return true;
    }

    async popState(): Promise<boolean> {
        if (this.stack.length <= 1) return false;

        const current = this.stack.pop()!;
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

    update(dt: number): void {
        if (this.stack.length > 0) {
            this.stack[this.stack.length - 1].state.onUpdate(dt);
        }
    }

    getCurrentState(): FSMState | null {
        return this.stack.length > 0 ? this.stack[this.stack.length - 1].state : null;
    }

    getCurrentStateName(): string | null {
        return this.getCurrentState()?.name ?? null;
    }

    getStackDepth(): number {
        return this.stack.length;
    }

    getTransitionHistory(): StateTransition[] {
        return [...this.transitions];
    }

    isStateActive(name: string): boolean {
        return this.stack.some(f => f.state.name === name);
    }

    findState(name: string): FSMState | undefined {
        return this.states.get(name);
    }

    private async safeCall(fn: () => void | Promise<void>): Promise<void> {
        try {
            const result = fn();
            if (result instanceof Promise) await result;
        } catch (err) {
            console.error('[FSM] Error:', err);
        }
    }

    reset(): void {
        this.stack = [];
        this.transitions = [];
    }
}
