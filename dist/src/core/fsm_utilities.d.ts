/**
 * [41-50] FSM 유틸리티 모듈
 *
 * 포함:
 *   41. FsmTransitionValidator - 상태 전이 유효성 검증기
 *   42. TransitionAnimationSync - 트랜지션 애니메이션 동기화
 *   43. AsyncTransitionPromisePool - 비동기 상태 전이 프라미스 풀
 *   45. FsmSafeguardRecovery - 예외 발생 시 세이프가드 복구기
 *   46. InputMappingMask - 상태별 입력 매핑 마스크
 *   49. FsmEventLogBuffer - FSM 이벤트 로그 버퍼
 *   50. VirtualScenarioAdapter - 가상 시나리오 전환 컨텍스트 어댑터
 */
import { GameStateMachine } from './fsm_state.js';
export interface TransitionRule {
    readonly from: string;
    readonly to: string;
    readonly allowed: boolean;
}
export declare class FsmTransitionValidator {
    private rules;
    addRule(from: string, to: string, allowed: boolean): void;
    allow(from: string, to: string): void;
    deny(from: string, to: string): void;
    canTransition(from: string, to: string): boolean;
    addDefaultTransitions(): void;
    clear(): void;
}
export type TransitionAnimCallback = (from: string, to: string) => Promise<void>;
export declare class TransitionAnimationSync {
    private animations;
    onTransition(from: string, to: string, callback: TransitionAnimCallback): void;
    play(from: string, to: string): Promise<void>;
    clear(): void;
}
export declare class AsyncTransitionPromisePool {
    private pending;
    add(id: string, promise: Promise<unknown>): void;
    waitAll(): Promise<void>;
    waitFor(id: string): Promise<unknown>;
    getPendingCount(): number;
    clear(): void;
}
export declare class FsmSafeguardRecovery {
    private fallbackState;
    private recoveryCount;
    setFallbackState(state: string): void;
    recover(machine: GameStateMachine, error: Error): Promise<boolean>;
    getRecoveryCount(): number;
    reset(): void;
}
export type InputAction = string;
export interface InputMaskConfig {
    readonly state: string;
    readonly allowedActions: Set<InputAction>;
    readonly blockedActions: Set<InputAction>;
}
export declare class InputMappingMask {
    private configs;
    setMask(state: string, allowed: InputAction[], blocked: InputAction[]): void;
    isActionAllowed(state: string, action: InputAction): boolean;
    blockAll(state: string): void;
    clear(): void;
}
export interface FsmLogEntry {
    readonly timestamp: number;
    readonly type: 'TRANSITION' | 'PUSH' | 'POP' | 'ERROR' | 'RECOVER';
    readonly from: string;
    readonly to: string;
    readonly detail: string;
}
export declare class FsmEventLogBuffer {
    private logs;
    private readonly maxSize;
    constructor(maxSize?: number);
    log(type: FsmLogEntry['type'], from: string, to: string, detail?: string): void;
    getRecent(count?: number): FsmLogEntry[];
    getByType(type: FsmLogEntry['type']): FsmLogEntry[];
    replay(machine: GameStateMachine): void;
    clear(): void;
}
export type ScenarioMode = 'HISTORICAL' | 'FICTIONAL';
export interface ScenarioConfig {
    readonly mode: ScenarioMode;
    readonly eventSuppression: string[];
    readonly transitionOverrides: Array<{
        from: string;
        to: string;
    }>;
    readonly name: string;
}
export declare class VirtualScenarioAdapter {
    private config;
    constructor();
    setMode(mode: ScenarioMode): void;
    getConfig(): ScenarioConfig;
    isEventSuppressed(eventId: string): boolean;
    getMode(): ScenarioMode;
    configureCustom(config: Partial<ScenarioConfig>): void;
}
//# sourceMappingURL=fsm_utilities.d.ts.map