/**
 * [16][17][19][24][27] 중앙 이벤트 등록소 — EventTriggerRegistry
 *
 * EventTriggerRegistry (싱글톤):
 *   1. 시스템 내 모든 연의전, 내정, 외교 이벤트를 고유 ID 키로 바인딩하고 검색
 *   2. 옵저버 패턴 기반 동적 이벤트 리스너 디스패처 (Task 17)
 *   3. 이벤트 체인 우선순위 레졸루션 (Task 19)
 *   4. 일회성(Once) vs 반복성(Recurring) 트리거 생명주기 관리 (Task 24)
 *   5. 시간 지연(Delayed) 트리거 큐 (Task 27)
 *   6. JSON 기반 선언형 조건 이벤트 로더 (Task 18 연동)
 */
// ============================================================
// 이벤트 트리거 레지스트리
// ============================================================
const PRIORITY_ORDER = {
    HISTORICAL: 0,
    FICTIONAL: 1,
    BATTLE: 2,
    DIPLOMACY: 3,
    MINIGAME: 4,
    DOMESTIC: 5,
};
export class EventTriggerRegistry {
    constructor() {
        this.events = new Map();
        this.listeners = new Map();
        this.lifecycleStates = new Map();
        this.delayedQueue = [];
        this.triggerHistory = [];
        this.isProcessing = false;
    } // singleton
    static getInstance() {
        if (!EventTriggerRegistry.instance) {
            EventTriggerRegistry.instance = new EventTriggerRegistry();
        }
        return EventTriggerRegistry.instance;
    }
    // ============================================================
    // 이벤트 등록 / 제거
    // ============================================================
    registerEvent(event) {
        this.events.set(event.id, event);
        this.lifecycleStates.set(event.id, {
            eventId: event.id,
            triggerCount: 0,
            maxTriggers: event.once ? 1 : Infinity,
            isAlive: true,
            registeredAt: Date.now(),
        });
        if (event.delayTurns !== undefined && event.delayTurns > 0) {
            this.delayedQueue.push({
                eventId: event.id,
                remainingTurns: event.delayTurns,
                event,
            });
        }
    }
    unregisterEvent(eventId) {
        this.events.delete(eventId);
        this.lifecycleStates.delete(eventId);
        this.delayedQueue = this.delayedQueue.filter(e => e.eventId !== eventId);
    }
    getEvent(eventId) {
        return this.events.get(eventId);
    }
    // ============================================================
    // 옵저버 패턴 (Task 17)
    // ============================================================
    subscribe(type, listener) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, new Set());
        }
        this.listeners.get(type).add(listener);
        return () => this.listeners.get(type)?.delete(listener);
    }
    notifyListeners(event) {
        const typeListeners = this.listeners.get(event.type);
        if (typeListeners) {
            for (const listener of typeListeners) {
                try {
                    listener(event);
                }
                catch (err) {
                    console.error(`[EventRegistry] Listener error for ${event.id}:`, err);
                }
            }
        }
    }
    // ============================================================
    // 상태 변화 감지 디스패처 (로우 레벨 상태 옵저버)
    // ============================================================
    dispatchStateChange(category, entityId, field, oldValue, newValue) {
        const type = `STATE_CHANGE_${category}`;
        const listeners = this.listeners.get(type);
        if (!listeners)
            return;
        const syntheticEvent = {
            id: `state_${category}_${entityId}_${field}_${Date.now()}`,
            name: `State Change: ${category}.${field}`,
            type,
            priority: 'DOMESTIC',
            once: false,
            condition: () => true,
            action: () => { },
        };
        for (const listener of listeners) {
            try {
                listener(syntheticEvent);
            }
            catch (err) {
                console.error(`[EventRegistry] State dispatch error:`, err);
            }
        }
    }
    // ============================================================
    // 이벤트 처리 (우선순위 정렬 + 생명주기)
    // ============================================================
    processEvents() {
        if (this.isProcessing)
            return;
        this.isProcessing = true;
        try {
            // 1. 지연 큐 처리
            this.processDelayedQueue();
            // 2. 우선순위 정렬 후 실행
            const sorted = Array.from(this.events.values()).sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
            for (const event of sorted) {
                const state = this.lifecycleStates.get(event.id);
                if (!state || !state.isAlive)
                    continue;
                const conditionMet = this.safeEvaluate(event);
                if (conditionMet) {
                    this.safeExecute(event);
                    state.triggerCount += 1;
                    this.triggerHistory.push(event.id);
                    if (event.once || state.triggerCount >= state.maxTriggers) {
                        state.isAlive = false;
                        this.events.delete(event.id);
                    }
                    this.notifyListeners(event);
                }
            }
        }
        finally {
            this.isProcessing = false;
        }
    }
    // ============================================================
    // 안전 실행 (Sandbox)
    // ============================================================
    safeEvaluate(event) {
        try {
            return event.condition();
        }
        catch (err) {
            console.error(`[EventRegistry] Condition error for ${event.id}:`, err);
            return false;
        }
    }
    safeExecute(event) {
        try {
            const result = event.action();
            if (result instanceof Promise) {
                result.catch(err => console.error(`[EventRegistry] Action promise error for ${event.id}:`, err));
            }
        }
        catch (err) {
            console.error(`[EventRegistry] Action error for ${event.id}:`, err);
        }
    }
    // ============================================================
    // 지연 트리거 큐 (Task 27)
    // ============================================================
    advanceDelayedTurns() {
        for (const entry of this.delayedQueue) {
            entry.remainingTurns -= 1;
        }
    }
    processDelayedQueue() {
        const ready = [];
        const remaining = [];
        for (const entry of this.delayedQueue) {
            if (entry.remainingTurns <= 0) {
                ready.push({ eventId: entry.eventId, event: entry.event });
            }
            else {
                remaining.push(entry);
            }
        }
        this.delayedQueue = remaining;
        for (const { event } of ready) {
            this.safeExecute(event);
            this.notifyListeners(event);
        }
    }
    scheduleDelayedEvent(eventId, turns) {
        const event = this.events.get(eventId);
        if (!event)
            return;
        this.delayedQueue.push({ eventId, remainingTurns: turns, event });
    }
    // ============================================================
    // 쿼리 메서드
    // ============================================================
    getEventsByPriority(priority) {
        return Array.from(this.events.values()).filter(e => e.priority === priority);
    }
    getEventsByType(type) {
        return Array.from(this.events.values()).filter(e => e.type === type);
    }
    getRegisteredCount() {
        return this.events.size;
    }
    getLifecycleState(eventId) {
        return this.lifecycleStates.get(eventId);
    }
    getAllLifecycleStates() {
        return Array.from(this.lifecycleStates.values());
    }
    getTriggerHistory() {
        return [...this.triggerHistory];
    }
    getDelayedQueueLength() {
        return this.delayedQueue.length;
    }
    isCurrentlyProcessing() {
        return this.isProcessing;
    }
    // ============================================================
    // JSON 기반 선언형 이벤트 로더 (Task 18 연동)
    // ============================================================
    loadFromDefinitions(definitions, conditionFactory, actionFactory) {
        for (const def of definitions) {
            this.registerEvent({
                id: def.id,
                name: def.name,
                type: def.type,
                priority: def.priority,
                once: def.once,
                condition: conditionFactory(def.conditions),
                action: actionFactory(def.actions),
                delayTurns: def.delayTurns,
            });
        }
    }
    // ============================================================
    // 초기화
    // ============================================================
    reset() {
        this.events.clear();
        this.listeners.clear();
        this.lifecycleStates.clear();
        this.delayedQueue = [];
        this.triggerHistory = [];
        this.isProcessing = false;
    }
}
//# sourceMappingURL=event_trigger_registry.js.map