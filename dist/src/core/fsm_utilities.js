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
export class FsmTransitionValidator {
    constructor() {
        this.rules = [];
    }
    addRule(from, to, allowed) {
        this.rules.push({ from, to, allowed });
    }
    allow(from, to) {
        this.addRule(from, to, true);
    }
    deny(from, to) {
        this.addRule(from, to, false);
    }
    canTransition(from, to) {
        const rule = this.rules.find(r => r.from === from && r.to === to);
        if (rule !== undefined)
            return rule.allowed;
        const defaultDeny = this.rules.find(r => r.from === from);
        return defaultDeny === undefined;
    }
    addDefaultTransitions() {
        const allStates = ['TITLE', 'WORLD_MAP', 'DOMESTIC', 'STRATEGY', 'BATTLE',
            'EVENT_PLAYING', 'MINIGAME', 'FISCAL', 'MORALE',
            'SAVE_LOAD', 'DEBRIEFING', 'GAME_OVER'];
        for (const from of allStates) {
            for (const to of allStates) {
                if (from !== to)
                    this.allow(from, to);
            }
        }
        this.deny('BATTLE', 'TITLE');
        this.deny('GAME_OVER', 'MINIGAME');
    }
    clear() {
        this.rules = [];
    }
}
export class TransitionAnimationSync {
    constructor() {
        this.animations = new Map();
    }
    onTransition(from, to, callback) {
        this.animations.set(`${from}->${to}`, callback);
    }
    async play(from, to) {
        const key = `${from}->${to}`;
        const anim = this.animations.get(key);
        if (anim) {
            await anim(from, to);
        }
    }
    clear() {
        this.animations.clear();
    }
}
// ============================================================
// [43] 비동기 상태 전이 프라미스 풀
// ============================================================
export class AsyncTransitionPromisePool {
    constructor() {
        this.pending = new Map();
    }
    add(id, promise) {
        this.pending.set(id, promise);
        promise.finally(() => this.pending.delete(id));
    }
    async waitAll() {
        const promises = Array.from(this.pending.values());
        await Promise.allSettled(promises);
    }
    async waitFor(id) {
        const promise = this.pending.get(id);
        return promise ?? Promise.resolve();
    }
    getPendingCount() {
        return this.pending.size;
    }
    clear() {
        this.pending.clear();
    }
}
// ============================================================
// [45] FSM 세이프가드 복구기
// ============================================================
export class FsmSafeguardRecovery {
    constructor() {
        this.fallbackState = 'WORLD_MAP';
        this.recoveryCount = 0;
    }
    setFallbackState(state) {
        this.fallbackState = state;
    }
    async recover(machine, error) {
        this.recoveryCount++;
        console.error(`[Safeguard] 복구 #${this.recoveryCount}: ${error.message}`);
        machine.reset();
        await machine.transitionTo(this.fallbackState);
        return true;
    }
    getRecoveryCount() {
        return this.recoveryCount;
    }
    reset() {
        this.recoveryCount = 0;
    }
}
export class InputMappingMask {
    constructor() {
        this.configs = new Map();
    }
    setMask(state, allowed, blocked) {
        this.configs.set(state, {
            state,
            allowedActions: new Set(allowed),
            blockedActions: new Set(blocked),
        });
    }
    isActionAllowed(state, action) {
        const config = this.configs.get(state);
        if (!config)
            return true;
        if (config.blockedActions.has(action))
            return false;
        return config.allowedActions.size === 0 || config.allowedActions.has(action);
    }
    blockAll(state) {
        this.configs.set(state, {
            state,
            allowedActions: new Set(),
            blockedActions: new Set(['ALL']),
        });
    }
    clear() {
        this.configs.clear();
    }
}
export class FsmEventLogBuffer {
    constructor(maxSize = 1000) {
        this.logs = [];
        this.maxSize = maxSize;
    }
    log(type, from, to, detail = '') {
        this.logs.push({ timestamp: Date.now(), type, from, to, detail });
        if (this.logs.length > this.maxSize) {
            this.logs = this.logs.slice(-this.maxSize);
        }
    }
    getRecent(count = 50) {
        return this.logs.slice(-count);
    }
    getByType(type) {
        return this.logs.filter(l => l.type === type);
    }
    replay(machine) {
        for (const entry of this.logs) {
            if (entry.type === 'TRANSITION') {
                console.log(`[Replay] ${entry.from} -> ${entry.to} (${entry.detail})`);
            }
        }
    }
    clear() {
        this.logs = [];
    }
}
export class VirtualScenarioAdapter {
    constructor() {
        this.setMode('HISTORICAL');
    }
    setMode(mode) {
        this.config = {
            mode,
            eventSuppression: mode === 'HISTORICAL' ? [] : ['HISTORICAL_EVENT'],
            transitionOverrides: [],
            name: mode === 'HISTORICAL' ? '역사 모드' : '가상 모드',
        };
    }
    getConfig() {
        return { ...this.config };
    }
    isEventSuppressed(eventId) {
        return this.config.eventSuppression.includes(eventId);
    }
    getMode() {
        return this.config.mode;
    }
    configureCustom(config) {
        this.config = { ...this.config, ...config };
    }
}
//# sourceMappingURL=fsm_utilities.js.map