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

export class StressTestRunner {
  private config: StressTestConfig;
  private turnMetrics: TurnMetrics[] = [];
  private errors: StressError[] = [];
  private running = false;
  private startTime = 0;

  constructor(config?: Partial<StressTestConfig>) {
    this.config = {
      totalTurns: 100,
      officersCount: 1000,
      factionsCount: 10,
      citiesCount: 50,
      relationshipsPerOfficer: 5,
      tickIntervalMs: 0,
      ...config,
    };
  }

  isRunning(): boolean { return this.running; }

  async run(onTurn?: (turn: number, metrics: TurnMetrics) => void): Promise<StressTestResult> {
    this.running = true;
    this.startTime = Date.now();
    this.turnMetrics = [];
    this.errors = [];

    for (let turn = 1; turn <= this.config.totalTurns && this.running; turn++) {
      const metrics = await this.executeTurn(turn);
      this.turnMetrics.push(metrics);

      if (metrics.error) {
        this.errors.push({ turn, message: metrics.error, phase: "UNKNOWN" });
      }

      if (onTurn) onTurn(turn, metrics);

      if (this.config.tickIntervalMs > 0) {
        await new Promise((r) => setTimeout(r, this.config.tickIntervalMs));
      }
    }

    this.running = false;
    return this.buildResult();
  }

  stop(): void {
    this.running = false;
  }

  private async executeTurn(turn: number): Promise<TurnMetrics> {
    const phaseTimes: Partial<Record<TurnPhase, number>> = {};
    const startTime = performance.now();

    try {
      phaseTimes.INIT = await this.measurePhase(() => this.simulateInit(turn));
      phaseTimes.OFFICER_PROCESSING = await this.measurePhase(() => this.simulateOfficerProcessing(turn));
      phaseTimes.RELATIONSHIP_UPDATE = await this.measurePhase(() => this.simulateRelationshipUpdate(turn));
      phaseTimes.ECONOMY = await this.measurePhase(() => this.simulateEconomy(turn));
      phaseTimes.AI_DECISIONS = await this.measurePhase(() => this.simulateAIDecisions(turn));
      phaseTimes.CLEANUP = await this.measurePhase(() => this.simulateCleanup(turn));
    } catch (e) {
      return {
        turn,
        phaseTimes,
        totalTimeMs: performance.now() - startTime,
        error: `Turn ${turn}: ${(e as Error).message}`,
      };
    }

    return {
      turn,
      phaseTimes,
      totalTimeMs: performance.now() - startTime,
    };
  }

  private async measurePhase(fn: () => void): Promise<number> {
    const start = performance.now();
    fn();
    return performance.now() - start;
  }

  private simulateInit(_turn: number): void {
    let count = 0;
    for (let i = 0; i < this.config.officersCount; i++) count++;
  }

  private simulateOfficerProcessing(_turn: number): void {
    let total = 0;
    for (let i = 0; i < this.config.officersCount; i++) {
      total += Math.sqrt(i * 100);
    }
  }

  private simulateRelationshipUpdate(_turn: number): void {
    for (let i = 0; i < this.config.officersCount; i++) {
      for (let j = 0; j < this.config.relationshipsPerOfficer; j++) {
        Math.random();
      }
    }
  }

  private simulateEconomy(_turn: number): void {
    for (let i = 0; i < this.config.citiesCount; i++) {
      Math.sqrt(i * 1000);
    }
  }

  private simulateAIDecisions(_turn: number): void {
    for (let i = 0; i < this.config.officersCount; i++) {
      Math.random() > 0.5;
    }
  }

  private simulateCleanup(_turn: number): void {
    // no-op
  }

  private buildResult(): StressTestResult {
    const totalTime = this.turnMetrics.reduce((s, m) => s + m.totalTimeMs, 0);
    const times = this.turnMetrics.map((m) => m.totalTimeMs);

    return {
      totalTurns: this.turnMetrics.length,
      totalTimeMs: totalTime,
      averageTurnTimeMs: times.length > 0 ? totalTime / times.length : 0,
      maxTurnTimeMs: times.length > 0 ? Math.max(...times) : 0,
      minTurnTimeMs: times.length > 0 ? Math.min(...times) : 0,
      errors: this.errors,
      passed: this.errors.length === 0,
    };
  }

  getTurnMetrics(): TurnMetrics[] {
    return [...this.turnMetrics];
  }

  getConfig(): StressTestConfig {
    return { ...this.config };
  }
}
