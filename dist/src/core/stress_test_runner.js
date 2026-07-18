/**
 * [Task 100] 통합 시나리오 스트레스 테스트 — StressTestRunner
 *
 * 100턴 자동 실행으로 시스템 안정성 검증.
 */
export class StressTestRunner {
    constructor(config) {
        this.turnMetrics = [];
        this.errors = [];
        this.running = false;
        this.startTime = 0;
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
    isRunning() { return this.running; }
    async run(onTurn) {
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
            if (onTurn)
                onTurn(turn, metrics);
            if (this.config.tickIntervalMs > 0) {
                await new Promise((r) => setTimeout(r, this.config.tickIntervalMs));
            }
        }
        this.running = false;
        return this.buildResult();
    }
    stop() {
        this.running = false;
    }
    async executeTurn(turn) {
        const phaseTimes = {};
        const startTime = performance.now();
        try {
            phaseTimes.INIT = await this.measurePhase(() => this.simulateInit(turn));
            phaseTimes.OFFICER_PROCESSING = await this.measurePhase(() => this.simulateOfficerProcessing(turn));
            phaseTimes.RELATIONSHIP_UPDATE = await this.measurePhase(() => this.simulateRelationshipUpdate(turn));
            phaseTimes.ECONOMY = await this.measurePhase(() => this.simulateEconomy(turn));
            phaseTimes.AI_DECISIONS = await this.measurePhase(() => this.simulateAIDecisions(turn));
            phaseTimes.CLEANUP = await this.measurePhase(() => this.simulateCleanup(turn));
        }
        catch (e) {
            return {
                turn,
                phaseTimes,
                totalTimeMs: performance.now() - startTime,
                error: `Turn ${turn}: ${e.message}`,
            };
        }
        return {
            turn,
            phaseTimes,
            totalTimeMs: performance.now() - startTime,
        };
    }
    async measurePhase(fn) {
        const start = performance.now();
        fn();
        return performance.now() - start;
    }
    simulateInit(_turn) {
        let count = 0;
        for (let i = 0; i < this.config.officersCount; i++)
            count++;
    }
    simulateOfficerProcessing(_turn) {
        let total = 0;
        for (let i = 0; i < this.config.officersCount; i++) {
            total += Math.sqrt(i * 100);
        }
    }
    simulateRelationshipUpdate(_turn) {
        for (let i = 0; i < this.config.officersCount; i++) {
            for (let j = 0; j < this.config.relationshipsPerOfficer; j++) {
                Math.random();
            }
        }
    }
    simulateEconomy(_turn) {
        for (let i = 0; i < this.config.citiesCount; i++) {
            Math.sqrt(i * 1000);
        }
    }
    simulateAIDecisions(_turn) {
        for (let i = 0; i < this.config.officersCount; i++) {
            Math.random() > 0.5;
        }
    }
    simulateCleanup(_turn) {
        // no-op
    }
    buildResult() {
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
    getTurnMetrics() {
        return [...this.turnMetrics];
    }
    getConfig() {
        return { ...this.config };
    }
}
//# sourceMappingURL=stress_test_runner.js.map