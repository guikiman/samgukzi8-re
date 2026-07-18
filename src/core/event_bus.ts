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

export class EventBus {
  private listeners = new Map<string, Set<GameEventListener>>();
  private history: GameEvent[] = [];
  private readonly maxHistory: number;
  private diary = new Map<number, DiaryEntry[]>();
  private currentTurn = 0;
  private currentTick = 0;

  constructor(maxHistory = 1000) {
    this.maxHistory = maxHistory;
  }

  setCurrentTurn(turn: number): void {
    this.currentTurn = turn;
  }

  setCurrentTick(tick: number): void {
    this.currentTick = tick;
  }

  subscribe(eventType: string, listener: GameEventListener): Unsubscriber {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);

    return () => {
      this.listeners.get(eventType)?.delete(listener);
    };
  }

  emit(type: string, payload: unknown, level: LogLevel = "info"): void {
    const event: GameEvent = { type, payload, timestamp: Date.now(), level };

    if (this.history.length >= this.maxHistory) {
      this.history.shift();
    }
    this.history.push(event);

    this.listeners.get(type)?.forEach((l) => l(event));
    this.listeners.get("*")?.forEach((l) => l(event));
  }

  getHistory(level?: LogLevel): readonly GameEvent[] {
    if (level) return this.history.filter((e) => e.level === level);
    return this.history;
  }

  clearHistory(): void {
    this.history = [];
  }

  listenerCount(eventType?: string): number {
    if (eventType) return this.listeners.get(eventType)?.size ?? 0;
    let count = 0;
    for (const set of this.listeners.values()) count += set.size;
    return count;
  }

  removeAllListeners(eventType?: string): void {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }

  writeDiary(entry: Omit<DiaryEntry, "turn" | "tick" | "timestamp">): void {
    const turn = this.currentTurn;
    if (!this.diary.has(turn)) {
      this.diary.set(turn, []);
    }
    const fullEntry: DiaryEntry = {
      turn,
      tick: this.currentTick,
      message: entry.message,
      timestamp: Date.now(),
    };
    this.diary.get(turn)!.push(fullEntry);
  }

  getDiary(turn?: number): readonly DiaryEntry[] {
    if (turn !== undefined) {
      return this.diary.get(turn) ?? [];
    }
    const all: DiaryEntry[] = [];
    for (const [, entries] of this.diary) {
      all.push(...entries);
    }
    return all;
  }

  getDiaryTurnRange(): { first: number; last: number } {
    const keys = Array.from(this.diary.keys()).sort((a, b) => a - b);
    if (keys.length === 0) return { first: 0, last: 0 };
    return { first: keys[0], last: keys[keys.length - 1] };
  }

  clearDiary(turn?: number): void {
    if (turn !== undefined) {
      this.diary.delete(turn);
    } else {
      this.diary.clear();
    }
  }

  serializeDiary(): string {
    const all: Record<number, string[]> = {};
    for (const [turn, entries] of this.diary) {
      all[turn] = entries.map(e => e.message);
    }
    return JSON.stringify(all);
  }

  deserializeDiary(json: string): void {
    try {
      const parsed = JSON.parse(json) as Record<string, string[]>;
      this.diary.clear();
      for (const [turnStr, messages] of Object.entries(parsed)) {
        const turn = parseInt(turnStr, 10);
        this.diary.set(turn, messages.map((msg) => ({
          turn,
          tick: 0,
          message: msg,
          timestamp: 0,
        })));
      }
    } catch {
      this.diary.clear();
    }
  }
}