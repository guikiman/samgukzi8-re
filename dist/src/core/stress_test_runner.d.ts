/**
 * [Task 100] 통합 시나리오 스트레스 테스트 — StressTestRunner
 *
 * 100턴 자동 실행으로 시스템 안정성 검증.
 */
export interface StressTestConfig {
    readonly totalTurns: number;
    readonly officersCount: number;
    readonly factionsCount: number;
    readonly citiesCount: number;
    readonly relationshipsPerOfficer: number;
    readonly tickIntervalMs: number;
}
export interface StressTestResult {
    readonly totalTurns: number;
    readonly totalTimeMs: number;
    readonly averageTurnTimeMs: number;
    readonly maxTurnTimeMs: number;
    readonly minTurnTimeMs: number;
    readonly errors: StressError[];
    readonly passed: boolean;
}
export interface StressError {
    readonly turn: number;
    readonly message: string;
    readonly phase: string;
}
export type TurnPhase = "INIT" | "OFFICER_PROCESSING" | "RELATIONSHIP_UPDATE" | "ECONOMY" | "AI_DECISIONS" | "CLEANUP";
export interface TurnMetrics {
    readonly turn: number;
    readonly phaseTimes: Partial<Record<TurnPhase, number>>;
    readonly totalTimeMs: number;
    readonly error?: string;
}
export declare class StressTestRunner {
    private config;
    private turnMetrics;
    private errors;
    private running;
    private startTime;
    constructor(config?: Partial<StressTestConfig>);
    isRunning(): boolean;
    run(onTurn?: (turn: number, metrics: TurnMetrics) => void): Promise<StressTestResult>;
    stop(): void;
    private executeTurn;
    private measurePhase;
    private simulateInit;
    private simulateOfficerProcessing;
    private simulateRelationshipUpdate;
    private simulateEconomy;
    private simulateAIDecisions;
    private simulateCleanup;
    private buildResult;
    getTurnMetrics(): TurnMetrics[];
    getConfig(): StressTestConfig;
}
//# sourceMappingURL=stress_test_runner.d.ts.map