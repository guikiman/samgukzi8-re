export type LogLevel = "debug" | "info" | "warn" | "error";
export interface GameEvent {
    readonly type: string;
    readonly payload: unknown;
    readonly timestamp: number;
    readonly level: LogLevel;
}
export type GameEventListener = (event: GameEvent) => void;
export interface Unsubscriber {
    (): void;
}
export interface DiaryEntry {
    readonly turn: number;
    readonly tick: number;
    readonly message: string;
    readonly timestamp: number;
}
export declare class EventBus {
    private listeners;
    private history;
    private readonly maxHistory;
    private diary;
    private currentTurn;
    private currentTick;
    constructor(maxHistory?: number);
    setCurrentTurn(turn: number): void;
    setCurrentTick(tick: number): void;
    subscribe(eventType: string, listener: GameEventListener): Unsubscriber;
    emit(type: string, payload: unknown, level?: LogLevel): void;
    getHistory(level?: LogLevel): readonly GameEvent[];
    clearHistory(): void;
    listenerCount(eventType?: string): number;
    removeAllListeners(eventType?: string): void;
    writeDiary(entry: Omit<DiaryEntry, "turn" | "tick" | "timestamp">): void;
    getDiary(turn?: number): readonly DiaryEntry[];
    getDiaryTurnRange(): {
        first: number;
        last: number;
    };
    clearDiary(turn?: number): void;
    serializeDiary(): string;
    deserializeDiary(json: string): void;
}
//# sourceMappingURL=event_bus.d.ts.map