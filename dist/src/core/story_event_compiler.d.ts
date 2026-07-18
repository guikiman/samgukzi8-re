/**
 * 삼국지 8 리메이크 — 연의전 이벤트 트리거 감지 및 비동기 시나리오 컴파일러
 * 파일: src/core/story_event_compiler.ts
 *
 * 선언적 JSON 스키마 → 런타임 조건 평가 → 체인 퀘스트 관리 → 트랜잭션 상태 적용
 *
 * [221~240] 연의전 조건부 내러티브 시스템
 * 관찰자(Observer) 패턴 기반 O(1) 사전 필터링
 * 다중 체인 퀘스트 스택 (Multi-Turn Chain Quest Stack)
 * 이벤트 실행 시 일반 루프를 비동기 정지(Pause) 가능
 */
import type { OfficerID, GameTime, IGameStore } from './types.js';
declare const brand: unique symbol;
type Brand<T, B extends string> = T & {
    readonly [brand]: B;
};
export type EventId = Brand<string, "EventId">;
export type ChainId = Brand<string, "ChainId">;
export declare function EventId(value: string): EventId;
export declare function ChainId(value: string): ChainId;
export type ConditionOp = "EQ" | "NE" | "GT" | "GTE" | "LT" | "LTE" | "BETWEEN" | "ANY" | "NONE";
export type ConditionField = "year" | "month" | "turn_count" | "officer_alive" | "officer_dead" | "officer_faction" | "officer_city" | "officer_hp" | "officer_loyalty" | "officer_fame" | "officer_merit" | "faction_exists" | "faction_reputation" | "faction_city_count" | "faction_officer_count" | "city_owner" | "city_defense" | "city_loyalty" | "city_population" | "event_triggered" | "chain_step_completed" | "random_probability" | "relation_type" | "affinity_between" | "set_global_flag";
export interface EventCondition {
    readonly field: ConditionField;
    readonly op: ConditionOp;
    readonly targetId?: string;
    readonly targetId2?: string;
    readonly value?: number;
    readonly value2?: number;
    readonly probability?: number;
}
export type TriggerLogic = "AND" | "OR";
export interface EventTrigger {
    readonly logic: TriggerLogic;
    readonly conditions: readonly EventCondition[];
}
export type ChainType = "single" | "multi_turn" | "branching";
export interface ChainConfig {
    readonly type: ChainType;
    readonly chainId?: ChainId;
    readonly stepIndex?: number;
    readonly totalSteps?: number;
    readonly expiryTurns?: number;
    readonly nextEventId?: EventId;
    readonly branchOnChoice?: boolean;
}
export type EffectType = "modify_officer_stat" | "modify_officer_field" | "modify_faction_field" | "modify_city_field" | "add_relationship" | "remove_relationship" | "officer_death" | "officer_remove" | "faction_destroy" | "faction_transfer_officer" | "faction_transfer_city" | "emit_game_event" | "set_global_flag";
export interface StateEffect {
    readonly type: EffectType;
    readonly targetId: string;
    readonly targetId2?: string;
    readonly field?: string;
    readonly value?: number | string | boolean;
    readonly delta?: number;
}
export interface DialogueChoice {
    readonly label: string;
    readonly tooltip?: string;
    readonly effects: readonly StateEffect[];
    readonly nextEventId?: EventId;
    readonly branchToChainId?: ChainId;
}
export interface DialogueBlock {
    readonly lines: readonly string[];
    readonly speakerId?: OfficerID;
    readonly choices?: readonly DialogueChoice[];
    readonly autoAdvance?: boolean;
    readonly autoAdvanceDelayMs?: number;
}
export interface GameEventSchema {
    readonly id: EventId;
    readonly name: string;
    readonly description: string;
    readonly category: "historical" | "fictional" | "character" | "disaster" | "chain_step";
    readonly priority: number;
    readonly trigger: EventTrigger;
    readonly chain: ChainConfig;
    readonly dialogue: DialogueBlock;
    readonly effects: readonly StateEffect[];
    readonly onFailEffects?: readonly StateEffect[];
    /** 한 번만 실행 (false = 매 조건 충족 시 반복) */
    readonly once?: boolean;
}
export interface ActiveChainQuest {
    readonly chainId: ChainId;
    readonly name: string;
    readonly startedTurn: number;
    readonly startedTime: GameTime;
    readonly expiryTurns: number;
    readonly totalSteps: number;
    readonly completedSteps: readonly number[];
    readonly currentStep: number;
    readonly isExpired: boolean;
    readonly history: readonly {
        readonly step: number;
        readonly eventId: EventId;
        readonly completedTurn: number;
    }[];
}
export declare class EventCompilerError extends Error {
    readonly eventId: EventId;
    readonly name = "EventCompilerError";
    constructor(eventId: EventId, message: string);
}
export declare class ConditionEvaluator {
    private readonly store;
    private readonly completedEvents;
    private readonly chainQuests;
    private readonly globalFlags;
    constructor(store: IGameStore, completedEvents: ReadonlySet<string>, chainQuests: readonly ActiveChainQuest[], globalFlags: ReadonlyMap<string, boolean>);
    evaluate(conditions: readonly EventCondition[], logic: TriggerLogic, gameTime: GameTime, turnCount: number): boolean;
    private evaluateSingle;
    private resolveField;
    private compare;
}
export interface Transaction {
    readonly eventId: EventId;
    readonly effects: readonly AppliedEffect[];
    readonly timestamp: number;
    readonly turn: number;
    readonly canRollback: boolean;
}
interface AppliedEffect {
    readonly effect: StateEffect;
    readonly oldValue: unknown;
    readonly success: boolean;
}
export declare class EventTransactionManager {
    private history;
    private readonly store;
    constructor(store: IGameStore);
    applyEffects(eventId: EventId, effects: readonly StateEffect[], turn: number): Transaction;
    rollbackLast(): boolean;
    getHistory(): readonly Transaction[];
    private applySingleEffect;
    private rollbackSingle;
}
export declare class StoryEventCompiler {
    private readonly events;
    private readonly index;
    private readonly completedEvents;
    private readonly chainQuests;
    private readonly globalFlags;
    private readonly onceEvents;
    private readonly evaluator;
    private readonly txManager;
    private readonly store;
    private paused;
    private onPauseRequest;
    constructor(store: IGameStore);
    registerEvent(schema: GameEventSchema): void;
    registerEvents(schemas: readonly GameEventSchema[]): void;
    scanActivatableEvents(gameTime: GameTime, turnCount: number): readonly GameEventSchema[];
    executeEvent(schema: GameEventSchema, turnCount: number): Transaction;
    startChain(chainId: ChainId, rootEvent: GameEventSchema, turnCount: number, expiryTurns: number): ActiveChainQuest;
    advanceChain(chainId: ChainId, eventId: EventId, step: number, turnCount: number): ActiveChainQuest | null;
    /** 만료된 체인 퀘스트 정리 (매 턴 호출) */
    cleanupExpiredChains(turnCount: number): readonly ChainId[];
    getActiveChain(chainId: ChainId): ActiveChainQuest | undefined;
    getAllActiveChains(): readonly ActiveChainQuest[];
    get isPaused(): boolean;
    requestPause(): Promise<void>;
    resume(): void;
    isEventCompleted(eventId: EventId): boolean;
    getCompletedEvents(): ReadonlySet<string>;
    setGlobalFlag(key: string, value: boolean): void;
    getGlobalFlag(key: string): boolean;
    getRegisteredEventCount(): number;
    resetSimulation(): void;
}
export declare const RED_CLIFFS_SCHEMAS: readonly GameEventSchema[];
export {};
//# sourceMappingURL=story_event_compiler.d.ts.map