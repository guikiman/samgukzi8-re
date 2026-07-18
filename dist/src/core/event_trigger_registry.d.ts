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
import type { OfficerID, FactionID, CityID } from './types.js';
export type EventTriggerType = string;
export type EventPriority = 'HISTORICAL' | 'FICTIONAL' | 'DOMESTIC' | 'DIPLOMACY' | 'BATTLE' | 'MINIGAME';
export interface GameEvent {
    readonly id: string;
    readonly name: string;
    readonly type: EventTriggerType;
    readonly priority: EventPriority;
    readonly once: boolean;
    readonly condition: () => boolean;
    readonly action: () => void | Promise<void>;
    readonly delayTurns?: number;
}
export interface EventListener {
    (event: GameEvent): void;
}
export interface EventTriggerDefinition {
    readonly id: string;
    readonly name: string;
    readonly type: EventTriggerType;
    readonly priority: EventPriority;
    readonly once: boolean;
    readonly conditions: Record<string, unknown>;
    readonly actions: string[];
    readonly delayTurns?: number;
}
export interface TriggerLifecycleState {
    readonly eventId: string;
    triggerCount: number;
    readonly maxTriggers: number;
    isAlive: boolean;
    readonly registeredAt: number;
}
export declare class EventTriggerRegistry {
    private static instance;
    private events;
    private listeners;
    private lifecycleStates;
    private delayedQueue;
    private triggerHistory;
    private isProcessing;
    private constructor();
    static getInstance(): EventTriggerRegistry;
    registerEvent(event: GameEvent): void;
    unregisterEvent(eventId: string): void;
    getEvent(eventId: string): GameEvent | undefined;
    subscribe(type: EventTriggerType, listener: EventListener): () => void;
    private notifyListeners;
    dispatchStateChange(category: 'OFFICER' | 'FACTION' | 'CITY' | 'DIPLOMACY', entityId: OfficerID | FactionID | CityID, field: string, oldValue: unknown, newValue: unknown): void;
    processEvents(): void;
    private safeEvaluate;
    private safeExecute;
    advanceDelayedTurns(): void;
    private processDelayedQueue;
    scheduleDelayedEvent(eventId: string, turns: number): void;
    getEventsByPriority(priority: EventPriority): GameEvent[];
    getEventsByType(type: EventTriggerType): GameEvent[];
    getRegisteredCount(): number;
    getLifecycleState(eventId: string): TriggerLifecycleState | undefined;
    getAllLifecycleStates(): TriggerLifecycleState[];
    getTriggerHistory(): string[];
    getDelayedQueueLength(): number;
    isCurrentlyProcessing(): boolean;
    loadFromDefinitions(definitions: EventTriggerDefinition[], conditionFactory: (conditions: Record<string, unknown>) => () => boolean, actionFactory: (actions: string[]) => () => void): void;
    reset(): void;
}
//# sourceMappingURL=event_trigger_registry.d.ts.map