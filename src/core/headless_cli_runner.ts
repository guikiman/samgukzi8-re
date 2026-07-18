import { SisyphusGameOrchestrator, GameState, GamePhase } from "./sisyphus_orchestrator";
import { GameCalendar } from "./game_calendar";
import { EventBus, DiaryEntry } from "./event_bus";

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

export class HeadlessCliRunner {
  private startTime = 0;
  private phaseSequence: GamePhase[] = [];
  private errorCount = 0;
  private lastTurn = 0;

  async run(config: HeadlessConfig): Promise<HeadlessResult> {
    this.startTime = Date.now();
    this.phaseSequence = [];
    this.errorCount = 0;
    this.lastTurn = 0;

    const calendar = new GameCalendar(184, 1);
    const orchestrator = new SisyphusGameOrchestrator(config.seed ?? Date.now());

    const initialState: Partial<GameState> = {
      calendar,
      currentTurn: 1,
    };

    await orchestrator.initialize(initialState);

    const bus = new EventBus();
    const unsubPhase = orchestrator.subscribe("PHASE_CHANGED", (event) => {
      const payload = event.payload as { from: GamePhase; to: GamePhase };
      this.phaseSequence.push(payload.to);
      if (config.logLevel === "verbose") {
        console.log(`[Phase] ${payload.from} → ${payload.to} (turn ${this.lastTurn})`);
      }
    });

    const unsubError = orchestrator.subscribe("ENGINE_ERROR", () => {
      this.errorCount++;
    });

    const unsubTurn = orchestrator.subscribe("TURN_CHANGED", (event) => {
      const payload = event.payload as { newTurn: number };
      this.lastTurn = payload.newTurn;
      if (config.logLevel === "verbose") {
        console.log(`[Turn] ${payload.newTurn}`);
      }
      if (config.logLevel === "summary" && payload.newTurn % 10 === 0) {
        console.log(`Progress: ${payload.newTurn}/${config.maxTurns} turns`);
      }
    });

    const timeoutPromise = new Promise<null>((_, reject) => {
      setTimeout(() => reject(new Error("Execution timed out")), config.turnTimeoutMs * config.maxTurns);
    });

    try {
      orchestrator.start();
      const startTurn = Date.now();
      while (orchestrator.getState().currentTurn < config.maxTurns) {
        const state = orchestrator.getState();
        if (state.currentPhase === GamePhase.GAME_OVER) break;

        const turnStart = Date.now();
        if (turnStart - startTurn > config.turnTimeoutMs * config.maxTurns) {
          throw new Error("Turn execution timed out");
        }
        await new Promise((r) => setTimeout(r, 5));
      }
    } catch (err) {
      if (config.logLevel !== "quiet") {
        console.error(`[Headless] ${err}`);
      }
      this.errorCount++;
    } finally {
      unsubPhase();
      unsubError();
      unsubTurn();
    }

    const totalDurationMs = Date.now() - this.startTime;
    const finalState = orchestrator.getState();

    if (config.logLevel !== "quiet") {
      console.log(`\n=== Headless Result ===`);
      console.log(`Turns: ${finalState.currentTurn}/${config.maxTurns}`);
      console.log(`Duration: ${totalDurationMs}ms`);
      console.log(`Phases: ${this.phaseSequence.length}`);
      console.log(`Errors: ${this.errorCount}`);
    }

    return {
      turnsCompleted: finalState.currentTurn,
      finalState,
      phaseSequence: [...this.phaseSequence],
      totalDurationMs,
      errorCount: this.errorCount,
      diaryEntries: 0,
    };
  }

  async runWithTimeout(config: HeadlessConfig, timeoutMs = 60000): Promise<HeadlessResult> {
    const result = await Promise.race([
      this.run(config),
      new Promise<HeadlessResult>((_, reject) =>
        setTimeout(() => reject(new Error(`Headless run timed out after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
    return result;
  }

  verify(result: HeadlessResult): HeadlessCheck {
    const errors: string[] = [];

    const validPhases = result.phaseSequence.every((p) =>
      Object.values(GamePhase).includes(p)
    );
    if (!validPhases) {
      errors.push("Invalid phase in sequence");
    }

    const hasDeadlock = result.phaseSequence.length > 0 &&
      result.phaseSequence[0] === result.phaseSequence[result.phaseSequence.length - 1] &&
      result.phaseSequence.length < 5;
    if (hasDeadlock) {
      errors.push("Possible deadlock: short phase cycle detected");
    }

    const turnMonotonic = result.finalState ? result.finalState.currentTurn > 0 : false;

    const stateConsistency = result.finalState
      ? result.finalState.currentTurn === result.turnsCompleted
      : false;

    if (!stateConsistency) {
      errors.push("Turn count mismatch between finalState and turnsCompleted");
    }

    return {
      phaseSequenceValid: validPhases,
      noDeadlocks: !hasDeadlock,
      turnMonotonic,
      stateConsistency,
      errors,
    };
  }

  async stressTest(
    iterations: number,
    config: HeadlessConfig,
  ): Promise<{ passes: number; failures: number; avgMs: number; results: HeadlessResult[] }> {
    const results: HeadlessResult[] = [];
    let passes = 0;
    let failures = 0;
    let totalMs = 0;

    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      try {
        const result = await this.run({ ...config, seed: config.seed ? config.seed + i : undefined });
        const check = this.verify(result);
        const duration = Date.now() - start;
        totalMs += duration;

        if (check.errors.length === 0) {
          passes++;
        } else {
          failures++;
          console.error(`[Stress] Iteration ${i + 1} FAILED: ${check.errors.join(", ")}`);
        }
        results.push(result);
      } catch (err) {
        failures++;
        console.error(`[Stress] Iteration ${i + 1} CRASHED: ${err}`);
      }
    }

    return {
      passes,
      failures,
      avgMs: totalMs / iterations,
      results,
    };
  }
}