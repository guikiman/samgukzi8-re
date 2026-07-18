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

import { GameStateMachine, type StateTransition } from './fsm_state.js';

// ============================================================
// [41] 상태 전이 유효성 검증기
// ============================================================

export interface TransitionRule {
    readonly from: string;
    readonly to: string;
    readonly allowed: boolean;
}

export class FsmTransitionValidator {
    private rules: TransitionRule[] = [];

    addRule(from: string, to: string, allowed: boolean): void {
        this.rules.push({ from, to, allowed });
    }

    allow(from: string, to: string): void {
        this.addRule(from, to, true);
    }

    deny(from: string, to: string): void {
        this.addRule(from, to, false);
    }

    canTransition(from: string, to: string): boolean {
        const rule = this.rules.find(r => r.from === from && r.to === to);
        if (rule !== undefined) return rule.allowed;

        const defaultDeny = this.rules.find(r => r.from === from);
        return defaultDeny === undefined;
    }

    addDefaultTransitions(): void {
        const allStates = ['TITLE', 'WORLD_MAP', 'DOMESTIC', 'STRATEGY', 'BATTLE',
                          'EVENT_PLAYING', 'MINIGAME', 'FISCAL', 'MORALE',
                          'SAVE_LOAD', 'DEBRIEFING', 'GAME_OVER'];
        for (const from of allStates) {
            for (const to of allStates) {
                if (from !== to) this.allow(from, to);
            }
        }
        this.deny('BATTLE', 'TITLE');
        this.deny('GAME_OVER', 'MINIGAME');
    }

    clear(): void {
        this.rules = [];
    }
}

// ============================================================
// [42] 트랜지션 애니메이션 동기화
// ============================================================

export type TransitionAnimCallback = (from: string, to: string) => Promise<void>;

export class TransitionAnimationSync {
    private animations: Map<string, TransitionAnimCallback> = new Map();

    onTransition(from: string, to: string, callback: TransitionAnimCallback): void {
        this.animations.set(`${from}->${to}`, callback);
    }

    async play(from: string, to: string): Promise<void> {
        const key = `${from}->${to}`;
        const anim = this.animations.get(key);
        if (anim) {
            await anim(from, to);
        }
    }

    clear(): void {
        this.animations.clear();
    }
}

// ============================================================
// [43] 비동기 상태 전이 프라미스 풀
// ============================================================

export class AsyncTransitionPromisePool {
    private pending: Map<string, Promise<unknown>> = new Map();

    add(id: string, promise: Promise<unknown>): void {
        this.pending.set(id, promise);
        promise.finally(() => this.pending.delete(id));
    }

    async waitAll(): Promise<void> {
        const promises = Array.from(this.pending.values());
        await Promise.allSettled(promises);
    }

    async waitFor(id: string): Promise<unknown> {
        const promise = this.pending.get(id);
        return promise ?? Promise.resolve();
    }

    getPendingCount(): number {
        return this.pending.size;
    }

    clear(): void {
        this.pending.clear();
    }
}

// ============================================================
// [45] FSM 세이프가드 복구기
// ============================================================

export class FsmSafeguardRecovery {
    private fallbackState = 'WORLD_MAP';
    private recoveryCount = 0;

    setFallbackState(state: string): void {
        this.fallbackState = state;
    }

    async recover(machine: GameStateMachine, error: Error): Promise<boolean> {
        this.recoveryCount++;
        console.error(`[Safeguard] 복구 #${this.recoveryCount}: ${error.message}`);
        machine.reset();
        await machine.transitionTo(this.fallbackState);
        return true;
    }

    getRecoveryCount(): number {
        return this.recoveryCount;
    }

    reset(): void {
        this.recoveryCount = 0;
    }
}

// ============================================================
// [46] 상태별 입력 매핑 마스크
// ============================================================

export type InputAction = string;

export interface InputMaskConfig {
    readonly state: string;
    readonly allowedActions: Set<InputAction>;
    readonly blockedActions: Set<InputAction>;
}

export class InputMappingMask {
    private configs: Map<string, InputMaskConfig> = new Map();

    setMask(state: string, allowed: InputAction[], blocked: InputAction[]): void {
        this.configs.set(state, {
            state,
            allowedActions: new Set(allowed),
            blockedActions: new Set(blocked),
        });
    }

    isActionAllowed(state: string, action: InputAction): boolean {
        const config = this.configs.get(state);
        if (!config) return true;
        if (config.blockedActions.has(action)) return false;
        return config.allowedActions.size === 0 || config.allowedActions.has(action);
    }

    blockAll(state: string): void {
        this.configs.set(state, {
            state,
            allowedActions: new Set(),
            blockedActions: new Set(['ALL']),
        });
    }

    clear(): void {
        this.configs.clear();
    }
}

// ============================================================
// [49] FSM 이벤트 로그 버퍼
// ============================================================

export interface FsmLogEntry {
    readonly timestamp: number;
    readonly type: 'TRANSITION' | 'PUSH' | 'POP' | 'ERROR' | 'RECOVER';
    readonly from: string;
    readonly to: string;
    readonly detail: string;
}

export class FsmEventLogBuffer {
    private logs: FsmLogEntry[] = [];
    private readonly maxSize: number;

    constructor(maxSize = 1000) {
        this.maxSize = maxSize;
    }

    log(type: FsmLogEntry['type'], from: string, to: string, detail = ''): void {
        this.logs.push({ timestamp: Date.now(), type, from, to, detail });
        if (this.logs.length > this.maxSize) {
            this.logs = this.logs.slice(-this.maxSize);
        }
    }

    getRecent(count = 50): FsmLogEntry[] {
        return this.logs.slice(-count);
    }

    getByType(type: FsmLogEntry['type']): FsmLogEntry[] {
        return this.logs.filter(l => l.type === type);
    }

    replay(machine: GameStateMachine): void {
        for (const entry of this.logs) {
            if (entry.type === 'TRANSITION') {
                console.log(`[Replay] ${entry.from} -> ${entry.to} (${entry.detail})`);
            }
        }
    }

    clear(): void {
        this.logs = [];
    }
}

// ============================================================
// [50] 가상 시나리오 전환 컨텍스트 어댑터
// ============================================================

export type ScenarioMode = 'HISTORICAL' | 'FICTIONAL';

export interface ScenarioConfig {
    readonly mode: ScenarioMode;
    readonly eventSuppression: string[];
    readonly transitionOverrides: Array<{ from: string; to: string }>;
    readonly name: string;
}

export class VirtualScenarioAdapter {
    private config!: ScenarioConfig;

    constructor() {
        this.setMode('HISTORICAL');
    }

    setMode(mode: ScenarioMode): void {
        this.config = {
            mode,
            eventSuppression: mode === 'HISTORICAL' ? [] : ['HISTORICAL_EVENT'],
            transitionOverrides: [],
            name: mode === 'HISTORICAL' ? '역사 모드' : '가상 모드',
        };
    }

    getConfig(): ScenarioConfig {
        return { ...this.config };
    }

    isEventSuppressed(eventId: string): boolean {
        return this.config.eventSuppression.includes(eventId);
    }

    getMode(): ScenarioMode {
        return this.config.mode;
    }

    configureCustom(config: Partial<ScenarioConfig>): void {
        this.config = { ...this.config, ...config };
    }
}
