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
}
//# sourceMappingURL=historical_event_system.d.ts.map