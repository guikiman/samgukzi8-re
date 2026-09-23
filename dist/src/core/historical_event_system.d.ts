export interface HistoricalEvent {
    readonly id: string;
    readonly year: number;
    readonly month: number;
    readonly title: string;
    readonly description: string;
    readonly conditions: HistoricalCondition[];
    readonly effects: HistoricalEffect[];
    triggered: boolean;
    readonly oneTimeOnly: boolean;
}
export interface HistoricalCondition {
    readonly type: "year_reached" | "officer_alive" | "officer_dead" | "faction_exists" | "faction_destroyed" | "city_owned" | "relation_threshold";
    readonly params: Record<string, string | number>;
}
export interface HistoricalEffect {
    readonly type: "officer_transfer" | "faction_merge" | "relation_change" | "event_flag" | "message";
    readonly params: Record<string, string | number>;
}
export declare class HistoricalEventSystem {
    private events;
    private triggeredIds;
    private globalFlags;
    registerEvent(event: HistoricalEvent): void;
    registerDefaultEvents(): void;
    checkEvents(currentYear: number, currentMonth: number, officerStatus: Map<string, boolean>, factionStatus: Map<string, boolean>): HistoricalEvent[];
    private evaluateCondition;
    private applyEffects;
    isFlagSet(flag: string): boolean;
    getTriggeredEvents(): HistoricalEvent[];
    getPendingEvents(currentYear: number, currentMonth: number): HistoricalEvent[];
    /** 세이브용 스냅샷 — 발동 이력/전역 플래그 보존 (재발동 방지) */
    serialize(): {
        triggeredIds: string[];
        flags: Array<[string, boolean]>;
    };
    /** 세이브 복원 — 발동 이력/플래그 재구성 (이벤트 정의는 코드 유지) */
    restore(data: {
        triggeredIds: string[];
        flags?: Array<[string, boolean]>;
    }): void;
}
//# sourceMappingURL=historical_event_system.d.ts.map