export type ConsoleCommand = ({
    type: "add_gold";
    factionId: string;
    amount: number;
} | {
    type: "add_rice";
    factionId: string;
    amount: number;
} | {
    type: "set_affinity";
    sourceId: string;
    targetId: string;
    value: number;
} | {
    type: "force_marriage";
    officerA: string;
    officerB: string;
} | {
    type: "kill_officer";
    officerId: string;
} | {
    type: "merge_factions";
    targetFactionId: string;
    absorbedByFactionId: string;
} | {
    type: "skip_childhood";
    childId: string;
    targetAge: number;
} | {
    type: "set_stat";
    officerId: string;
    stat: string;
    value: number;
} | {
    type: "trigger_event";
    eventId: string;
} | {
    type: "toggle_flag";
    flag: string;
} | {
    type: "evaluate";
    code: string;
} | {
    type: "help";
} | {
    type: "list_officers";
    filter?: string;
} | {
    type: "list_factions";
} | {
    type: "set_weather";
    cityId: string;
    weather: string;
} | {
    type: "add_population";
    cityId: string;
    amount: number;
} | {
    type: "set_loyalty";
    officerId: string;
    value: number;
});
export interface ConsoleResult {
    readonly success: boolean;
    readonly message: string;
    readonly data?: unknown;
}
export declare class DevSandboxConsole {
    private commandHistory;
    private maxHistory;
    private customHandlers;
    registerHandler(commandName: string, handler: (args: string[]) => ConsoleResult): void;
    execute(input: string): ConsoleResult;
    private executeBuiltin;
    getHistory(): string[];
    clearHistory(): void;
}
//# sourceMappingURL=dev_sandbox_console.d.ts.map