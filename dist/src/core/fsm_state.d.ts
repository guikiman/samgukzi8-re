/**
 * [31][32] FSMState 추상 클래스 + GameStateMachine HFSM 코어
 *
 * FSMState (Task 31):
 *   - onEnter(), onUpdate(), onExit(), onPause(), onResume() 지원
 * GameStateMachine (Task 32):
 *   - 계층형 상태 머신(HFSM) 스택 구조
 *   - 하위 상태(Sub-state) 진입 후 복귀 가능
 */
export declare abstract class FSMState {
    readonly name: string;
    constructor(name: string);
    abstract onEnter(context: Record<string, unknown>): void | Promise<void>;
    abstract onUpdate(dt: number): void;
    abstract onExit(): void | Promise<void>;
    onPause(): void;
    onResume(): void;
    protected getStateMachine(): GameStateMachine | null;
    private static activeMachine;
}
export type StateConstructor = new (...args: unknown[]) => FSMState;
export interface StateTransition {
    readonly from: string;
    readonly to: string;
    readonly reason: string;
    readonly timestamp: number;
}
export declare class GameStateMachine {
    private states;
    private stack;
    private transitions;
    private maxStackDepth;
    registerState(state: FSMState): void;
    unregisterState(name: string): void;
    transitionTo(name: string, context?: Record<string, unknown>): Promise<boolean>;
    pushState(name: string, context?: Record<string, unknown>): Promise<boolean>;
    popState(): Promise<boolean>;
    update(dt: number): void;
    getCurrentState(): FSMState | null;
    getCurrentStateName(): string | null;
    getStackDepth(): number;
    getTransitionHistory(): StateTransition[];
    isStateActive(name: string): boolean;
    findState(name: string): FSMState | undefined;
    private safeCall;
    reset(): void;
}
//# sourceMappingURL=fsm_state.d.ts.map