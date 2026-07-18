/**
 * [Task 88] 워커 로그 중앙 집계 — WorkerLogAggregator
 *
 * 여러 Web Worker에서 발생하는 로그를 중앙에서 수집하고
 * 레벨별 필터링, 버퍼링, 내보내기를 제공.
 */
const LOG_LEVEL_RANK = {
    DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3, FATAL: 4,
};
export class WorkerLogAggregator {
    constructor(maxLogs = 10000) {
        this.logs = [];
        this.idCounter = 0;
        this.maxLogs = maxLogs;
    }
    /**
     * 로그 추가
     */
    log(workerId, level, message, turn, context) {
        const entry = {
            id: `log_${this.idCounter++}_${Date.now()}`,
            timestamp: Date.now(),
            workerId, level, message, turn, context,
        };
        this.logs.push(entry);
        if (this.logs.length > this.maxLogs) {
            this.logs.splice(0, this.logs.length - this.maxLogs);
        }
        return entry;
    }
    /**
     * 편의 메서드
     */
    debug(workerId, message, turn, context) {
        return this.log(workerId, "DEBUG", message, turn, context);
    }
    info(workerId, message, turn, context) {
        return this.log(workerId, "INFO", message, turn, context);
    }
    warn(workerId, message, turn, context) {
        return this.log(workerId, "WARN", message, turn, context);
    }
    error(workerId, message, turn, context) {
        return this.log(workerId, "ERROR", message, turn, context);
    }
    fatal(workerId, message, turn, context) {
        return this.log(workerId, "FATAL", message, turn, context);
    }
    /**
     * 로그 조회 (필터 적용)
     */
    query(filter) {
        let results = [...this.logs];
        if (filter.workerId) {
            results = results.filter((e) => e.workerId === filter.workerId);
        }
        if (filter.level) {
            results = results.filter((e) => e.level === filter.level);
        }
        if (filter.minLevel) {
            const minRank = LOG_LEVEL_RANK[filter.minLevel];
            results = results.filter((e) => LOG_LEVEL_RANK[e.level] >= minRank);
        }
        if (filter.sinceTurn) {
            results = results.filter((e) => e.turn >= filter.sinceTurn);
        }
        if (filter.sinceTimestamp) {
            results = results.filter((e) => e.timestamp >= filter.sinceTimestamp);
        }
        if (filter.search) {
            const lower = filter.search.toLowerCase();
            results = results.filter((e) => e.message.toLowerCase().includes(lower));
        }
        if (filter.limit && filter.limit > 0) {
            results = results.slice(-filter.limit);
        }
        return results;
    }
    /**
     * 특정 워커의 로그
     */
    getWorkerLogs(workerId, limit = 100) {
        return this.query({ workerId, limit });
    }
    /**
     * 에러만 조회
     */
    getErrors(minLevel = "ERROR", limit = 50) {
        return this.query({ minLevel, limit });
    }
    /**
     * 최근 로그
     */
    getRecentLogs(count = 50) {
        return this.logs.slice(-count);
    }
    /**
     * 모든 로그를 문자열로 내보내기
     */
    exportLogs(filter) {
        const entries = filter ? this.query(filter) : this.logs;
        return entries.map((e) => {
            const time = new Date(e.timestamp).toISOString();
            const ctx = e.context ? ` ${JSON.stringify(e.context)}` : "";
            return `[${time}] [${e.workerId}] [${e.level}] (T${e.turn}) ${e.message}${ctx}`;
        }).join("\n");
    }
    /**
     * 통계
     */
    getStats() {
        const workers = new Set(this.logs.map((e) => e.workerId));
        const levelCounts = { DEBUG: 0, INFO: 0, WARN: 0, ERROR: 0, FATAL: 0 };
        for (const entry of this.logs) {
            levelCounts[entry.level]++;
        }
        return {
            totalLogs: this.logs.length,
            workerCount: workers.size,
            levelCounts,
            errorCount: levelCounts.ERROR + levelCounts.FATAL,
        };
    }
    /**
     * 로그 지우기
     */
    clear() {
        this.logs = [];
    }
}
//# sourceMappingURL=worker_log_aggregator.js.map