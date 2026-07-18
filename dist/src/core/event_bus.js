export class EventBus {
    constructor(maxHistory = 1000) {
        this.listeners = new Map();
        this.history = [];
        this.diary = new Map();
        this.currentTurn = 0;
        this.currentTick = 0;
        this.maxHistory = maxHistory;
    }
    setCurrentTurn(turn) {
        this.currentTurn = turn;
    }
    setCurrentTick(tick) {
        this.currentTick = tick;
    }
    subscribe(eventType, listener) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, new Set());
        }
        this.listeners.get(eventType).add(listener);
        return () => {
            this.listeners.get(eventType)?.delete(listener);
        };
    }
    emit(type, payload, level = "info") {
        const event = { type, payload, timestamp: Date.now(), level };
        if (this.history.length >= this.maxHistory) {
            this.history.shift();
        }
        this.history.push(event);
        this.listeners.get(type)?.forEach((l) => l(event));
        this.listeners.get("*")?.forEach((l) => l(event));
    }
    getHistory(level) {
        if (level)
            return this.history.filter((e) => e.level === level);
        return this.history;
    }
    clearHistory() {
        this.history = [];
    }
    listenerCount(eventType) {
        if (eventType)
            return this.listeners.get(eventType)?.size ?? 0;
        let count = 0;
        for (const set of this.listeners.values())
            count += set.size;
        return count;
    }
    removeAllListeners(eventType) {
        if (eventType) {
            this.listeners.delete(eventType);
        }
        else {
            this.listeners.clear();
        }
    }
    writeDiary(entry) {
        const turn = this.currentTurn;
        if (!this.diary.has(turn)) {
            this.diary.set(turn, []);
        }
        const fullEntry = {
            turn,
            tick: this.currentTick,
            message: entry.message,
            timestamp: Date.now(),
        };
        this.diary.get(turn).push(fullEntry);
    }
    getDiary(turn) {
        if (turn !== undefined) {
            return this.diary.get(turn) ?? [];
        }
        const all = [];
        for (const [, entries] of this.diary) {
            all.push(...entries);
        }
        return all;
    }
    getDiaryTurnRange() {
        const keys = Array.from(this.diary.keys()).sort((a, b) => a - b);
        if (keys.length === 0)
            return { first: 0, last: 0 };
        return { first: keys[0], last: keys[keys.length - 1] };
    }
    clearDiary(turn) {
        if (turn !== undefined) {
            this.diary.delete(turn);
        }
        else {
            this.diary.clear();
        }
    }
    serializeDiary() {
        const all = {};
        for (const [turn, entries] of this.diary) {
            all[turn] = entries.map(e => e.message);
        }
        return JSON.stringify(all);
    }
    deserializeDiary(json) {
        try {
            const parsed = JSON.parse(json);
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
        }
        catch {
            this.diary.clear();
        }
    }
}
//# sourceMappingURL=event_bus.js.map