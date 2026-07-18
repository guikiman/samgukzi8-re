import { GameState, GamePhase } from "./sisyphus_orchestrator";
export interface HeadlessConfig {
    maxTurns: number;
    turnTimeoutMs: number;
    logLevel: "quiet" | "summary" | "verbose";
    seed?: number;
}
export interface HeadlessResult {
    turnsCompleted: number;
    finalState: Readonly<GameState> | null;
    phaseSequence: GamePhase[];
    totalDurationMs: number;
    errorCount: number;
    diaryEntries: number;
}
export interface HeadlessCheck {
    phaseSequenceValid: boolean;
    noDeadlocks: boolean;
    turnMonotonic: boolean;
    stateConsistency: boolean;
    errors: string[];
}
export declare class HeadlessCliRunner {
    private startTime;
    private phaseSequence;
    private errorCount;
    private lastTurn;
    run(config: HeadlessConfig): Promise<HeadlessResult>;
    runWithTimeout(config: HeadlessConfig, timeoutMs?: number): Promise<HeadlessResult>;
    verify(result: HeadlessResult): HeadlessCheck;
    stressTest(iterations: number, config: HeadlessConfig): Promise<{
        passes: number;
        failures: number;
        avgMs: number;
        results: HeadlessResult[];
    }>;
}
//# sourceMappingURL=headless_cli_runner.d.ts.map